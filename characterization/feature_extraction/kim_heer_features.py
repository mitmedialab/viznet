import random
import numpy as np
import scipy as sc
import scipy.stats as sc_stats
from scipy.stats import entropy, normaltest, mode, kurtosis, skew, pearsonr, moment, zscore
import pandas as pd
from collections import OrderedDict

from .helpers import *
from .type_detection import detect_field_type, data_type_to_general_type, data_types, general_types

def get_c_entropy(v):
    value_counts = pd.Series(v).value_counts()
    unnormalized_entropy = entropy(value_counts)
    return unnormalized_entropy / np.log(len(value_counts))

def get_q_entropy(v, num_bins=20):
    hist, _ = np.histogram(v, bins=num_bins)
    return entropy(hist) / np.log(num_bins)

# Across all points, sum z-scores for 2d distance
def get_clusteredness(v1, v2):
    combined_v = np.array(list(zip(v1, v2)))
    mean_point = np.mean(combined_v, axis=0)
    distances = [ np.linalg.norm([e, mean_point]) for e in combined_v ]
    norm_distances = distances / np.std(distances)
    clusteredness = np.sum(norm_distances)
    return clusteredness

def extract_kim_heer_features(df, locator='locator', dataset_id='placeholder', MAX_FIELDS=3):
    features = OrderedDict()

    c_column = None
    q_columns = []

    # Single column features
    field_lengths = []
    for field_order, field_name in enumerate(df.columns):
        v = df[field_name]
        field_values = list(v[:v.last_valid_index()])
        field_id = field_order

        field_length = len(field_values)
        field_lengths.append(field_length)
        field_type, field_scores = detect_field_type(field_values)
        field_general_type = data_type_to_general_type[field_type]

        if field_general_type == 'c': 
            c_column = {
                'name': field_name,
                'values': field_values
            }
        
        if field_general_type == 'q':
            q_columns.append({
                'name': field_name,
                'values': pd.to_numeric(field_values, errors='coerce')
            })

    features['num_rows'] = np.max(field_lengths)

    # Single-column categorical features
    c1_values = c_column['values']
    unique_elements = get_unique(c1_values)
    features['c_cardinality'] = unique_elements.size

    num_per_category = pd.Series(c1_values).value_counts()  # df.groupby(field_name).count()

    features['c_num_per_category_mean'] = np.mean(num_per_category)
    features['c_num_per_category_min'] = np.min(num_per_category)
    features['c_num_per_category_max'] = np.max(num_per_category)
    features['c_num_per_category_std'] = np.std(num_per_category)
    features['c_entropy']  = get_c_entropy(c1_values)

    # Single-column quantitative features
    q1_values, q2_values = q_columns[0]['values'], q_columns[1]['values']
    features['q1_entropy'] = get_q_entropy(q1_values)
    features['q2_entropy'] = get_q_entropy(q2_values)

    # Pairwise-column quantitative features
    correlation_value, _ = pearsonr(q_columns[0]['values'], q_columns[1]['values'])
    features['q_q_correlation'] = correlation_value

    # Clusteredness
    only_quantitative_columns = df[[q_columns[0]['name'], q_columns[1]['name']]]
    clusteredness = get_clusteredness(q1_values, q2_values)  # zscore(only_quantitative_columns, axis=None)
    features['clusteredness'] = clusteredness
      
    return features