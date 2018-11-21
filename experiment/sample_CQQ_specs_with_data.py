'''
Script used to find valid datasets, extract exact CQQ datasets, randomly selecting one spec, then printing data

Output: tab-separated file with:
    corpus
    locator
    dataset_id
    column_metadata JSON-encoded specifications (list of { order, name, general_type })
    data
'''
import os
from os.path import join
import argparse
import pandas as pd
import numpy as np
import random
from time import time, strftime
import itertools
import json
import traceback
from collections import Counter

from read_raw_data import get_plotly_dfs, get_manyeyes_dfs, get_webtables_dfs, get_opendata_dfs
from feature_extraction.type_detection import detect_field_type, data_type_to_general_type, data_types, general_types
from feature_extraction.helpers import get_unique

parser = argparse.ArgumentParser()
parser.add_argument('corpus', type=str)
args = parser.parse_args()
corpus = args.corpus

get_dfs_by_corpus = {
    'plotly': get_plotly_dfs,
    'manyeyes': get_manyeyes_dfs,
    'webtables': get_webtables_dfs,
    'opendata': get_opendata_dfs
}

timeout=15
write_header = True
total_num = 0
valid_features = 0

output_dir = 'randomly_selected_cqq_specs_with_data'
os.makedirs(output_dir, exist_ok=True)

headers = [
    'corpus',
    'locator',
    'dataset_id',
    'combination_number',
    'column_metadata',
    'data'
]
output_file = open(join(output_dir, '{}_cqq_specs_with_data_all.tsv'.format(corpus)), 'w')
output_file.write('\t'.join(headers) + '\n')

one_per_dataset_output_file = open(join(output_dir, '{}_cqq_specs_with_data_one_per_dataset.tsv'.format(corpus)), 'w')
one_per_dataset_output_file.write('\t'.join(headers) + '\n')

print('Enumerating datasets for corpus:', corpus)

column_limits = {
    'min': 3,
    'max': 100
}

group_length_limits = {
    'min': 1,
    'max': 50
}

name_length_limits = {
    'min': 1,
    'max': 30
}

cardinality_limits = {
    'min': 3,
    'max': 30
}

num_per_category_limits = {
    'min': 3,
    'max': 30
}


def is_all_ascii(s):
    return all(ord(char) < 128 for char in s)


def get_combinations(field_metadata):
    combinations = []
    c_fields = [ f for f in field_metadata if f['general_type'] == 'c']
    q_fields = [ f for f in field_metadata if f['general_type'] == 'q']
    for c_field in c_fields:
        for q_pair in itertools.combinations(q_fields, 2):
            combinations.append([ c_field ] + list(q_pair))
    return combinations

c_dtypes = [ np.dtype('O'), np.dtype('bool') ]
q_dtypes = [ np.dtype('float32'), np.dtype('float32'), np.dtype('float64'), np.dtype('int64')]
t_dtypes = [ np.dtype('datetime64[ns]'), np.dtype('<M8[ns]') ]

def parse_datetime(v, value_limit=100):
    if v.dtypes == object:
        v = pd.to_datetime(v[:value_limit], errors='ignore')
    return v

def has_alpha(s):
    return any([ c.isalpha() for c in str(s) ])

def isNotEmpty(s):
    return bool(s and s.strip())

def get_field_metadata_if_valid(df):
    field_general_types = []
    field_metadata = []
    remappings = {}  # For re-parsed fields

    if df.empty:
        print('Empty df')
        return False

    dtypes = dict(df.dtypes)
    for field_order, field_name in enumerate(df.columns):

        # Name length
        if len(field_name) >= name_length_limits['max'] or len(field_name) <= name_length_limits['min']:
            continue

        # ASCII Name
        if not is_all_ascii(field_name):
            continue

        v = df[field_name]
        dtype = dtypes[field_name]

        # For webtables
        v = v.replace(('*', '-', '--'), np.nan)

        # All valid types
        has_any_null = v.isnull().values.any()
        if has_any_null:
            continue

        # None are empty
        all_are_not_empty = all([ isNotEmpty(str(s)) for s in v ])
        if not all_are_not_empty:
            continue

        # Force to numeric if possible
        v = pd.to_numeric(v, errors='ignore')
        dtype = v.dtype

        # Parse certain categorical fields
        if dtype in c_dtypes:
            # Try coercing again after replacing commas
            v_without_commas = v.replace(',', '')
            dtype_without_commas = pd.to_numeric(v_without_commas, errors='ignore').dtype
            if dtype_without_commas in q_dtypes:
                v = v_without_commas
                dtype = dtype_without_commas

        # Convert percentages and dollars
        if dtype in c_dtypes:
            num_percent = sum([ True for s in v if str(s).endswith('%') ])
            num_dollar = sum([ True for s in v if str(s).endswith('$') ])


            if num_percent / len(v) > 0.5:
                try:
                    v = pd.to_numeric(v.str.rstrip('%').astype('float') / 100.0, errors='coerce')
                    dtype = v.dtype
                except Exception as e:
                    print(e)
            if num_dollar / len(v) > 0.5:
                try:
                    v = pd.to_numeric(v.str.lstrip('$'), errors='coerce')
                    dtype = v.dtype
                except Exception as e:
                    print(e)

        date_strings = ('date', 'Date', 'DATE', 'year', 'Year', 'YEAR')
        if field_name in date_strings or field_name.endswith(date_strings):
            v = v.astype('str')
            dtype = np.dtype('O')

        # Force year to categorical
        if dtype in q_dtypes:
            num_year = sum([ True for s in v if (len(str(s)) >= 4 and str(s).startswith(('18', '19', '20', '21')))])
            months = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
            num_month = sum([ True for s in v if any((m in str(s)) for m in months) ])
            if num_year / len(v) > 0.5:
                v = v.astype('str')
                dtype = np.dtype('O')

        # Catch ID field
        if dtype in q_dtypes:
            if (field_name in ['id', 'ID', 'Id', 'name']) or field_name.endswith(('id', 'ID', 'Id', 'name')):
                v = v.astype('str')
                dtype = np.dtype('O')

        # All valid names
        if dtype in c_dtypes:
            field_general_type = 'c'

            # Remove list edgecase for Plotly
            if isinstance(list(v)[0], (list,)): continue

            # Constrain cardinality
            unique_elements = get_unique(list(v)).size
            if unique_elements < cardinality_limits['min'] or unique_elements > cardinality_limits['max']: continue

            # Constrain number per category
            num_per_category = pd.Series(list(v)).value_counts()  # df.groupby(field_name).count()
            num_per_category_mean = np.mean(num_per_category)
            if num_per_category_mean < num_per_category_limits['min'] or num_per_category_mean > num_per_category_limits['max']: continue

            # Constrain category value lenths
            categories = pd.Series(list(v)).unique()
            category_lengths = [ len(str(c)) for c in categories ]
            invalid_category_lengths = [ (l > group_length_limits['max'] or l < group_length_limits['min']) for l in category_lengths]
            if any(invalid_category_lengths):
                continue

            # Force all groups to have at least one alphabetical character
            all_categories_have_alphabetical = all([has_alpha(c) for c in categories])
            if not all_categories_have_alphabetical:
                continue

            # Finally, after all the filters, try to parse datetimes -- then filter them out
            attempted_datetime_parse_dtype = pd.to_datetime(v[:100], errors='ignore').dtype

            if attempted_datetime_parse_dtype in t_dtypes:
                field_general_type = 't'

        elif dtype in q_dtypes:
            field_general_type = 'q'

            # Return if all elements are the same
            if len(set(v)) <= 1:
                continue

            # Infinity
            has_any_inf = np.isinf(v).any()
            if has_any_inf:
                print('Inf')
                continue
        else:
            print('No matching dtype', dtype)
            continue

        df[field_name] = v

        field_general_types.append(field_general_type)
        field_metadata.append({
            'index': field_order,
            'name': field_name,
            'general_type': field_general_type,
            'dtype': dtype.name,
            'length': len(v)
        })

    lengths = [ fm['length'] for fm in field_metadata ]
    if len(set(lengths)) > 1:
        return False
    if field_general_types.count('c') < 1 or field_general_types.count('q') < 2:
        return False
    return { 'df': df, 'field_metadata': field_metadata }


total_num_combinations = 0
total_valid_datasets = 0
for d in get_dfs_by_corpus[corpus]():
    locator = d['locator']
    dataset_id = d['dataset_id']
    df = d['df']
    total_num += 1

    if total_num % 100 == 0:
        print('Number of datasets: ({} valid / {} total)'.format(total_valid_datasets, total_num))

    if len(df.columns) < column_limits['min'] or len(df.columns) > column_limits['max']: continue

    field_metadata = []
    start_time = time()
    while time() < (start_time + timeout):
        try:
            r = get_field_metadata_if_valid(df)
            if r:
                df = r['df']
                field_metadata = r['field_metadata']
        except Exception as e:
            print('Get metadata exception', e)
            continue
        break
    if not field_metadata: continue
    combinations = get_combinations(field_metadata)
    total_valid_datasets += 1

    print('\tNum combinations:', len(combinations))
    total_num_combinations += len(combinations)
    print('\tTotal num combinations:', total_num_combinations)

    random_to_pick = random.choice(range(0, len(combinations)))

    for combination_number, random_combination in enumerate(combinations):
        random_combination_names = [ fm['name'] for fm in random_combination ]
        df_cqq_subset = df[random_combination_names]
        df_cqq_subset_as_json = df_cqq_subset.to_json(orient='records')

        fields_to_write = [
            corpus,
            locator,
            dataset_id,
            str(combination_number),
            json.dumps(random_combination),
            df_cqq_subset_as_json
        ]

        print(df_cqq_subset.head())
        output_file.write('\t'.join(fields_to_write)+ '\n')

        if combination_number == random_to_pick:
            one_per_dataset_output_file.write('\t'.join(fields_to_write)+ '\n')

print('Total datasets:', total_num)
print('Total valid datasets:', total_valid_datasets)
print('\tTotal num combinations:', total_num_combinations)