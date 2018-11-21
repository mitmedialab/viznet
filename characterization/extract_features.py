'''
Module used to extract VizML features from a specificd corpus
'''

import os
from os.path import join
import argparse
import pandas as pd
from time import time, strftime

from feature_extraction.single_field_features import extract_single_field_features
from feature_extraction.aggregate_single_field_features import extract_aggregate_single_field_features
from read_raw_data import get_dfs_by_corpus

MAX_FIELDS = 10000

# Get corpus
parser = argparse.ArgumentParser()
parser.add_argument('corpus', type=str)
args = parser.parse_args()
corpus = args.corpus


# Create features directory
features_dir = './features'
if not os.path.exists(features_dir):
    os.mkdir(features_dir)
single_field_features_file_name = join(features_dir, '{}_single_field_features.csv'.format(corpus))
aggregate_single_field_features_file_name = join(features_dir, '{}_aggregate_single_field_features.csv'.format(corpus))


# Config
batch_size = 10
total_num = 0
valid_features = 0

read_existing_features = False
existing_feature_dataset_ids = []
write_mode = 'w'
write_header = True
if read_existing_features:
    write_mode = 'a'
    write_header = False
    with open(aggregate_single_field_features_file_name) as f:
        f.readline()
        for l in f:
            fields = l.split(',')
            dataset_id = fields[1]
            existing_feature_dataset_ids.append(dataset_id)

    print('Finished populating existing dataset ids:', len(existing_feature_dataset_ids))

print('Extracting features for corpus:', corpus)
batch_single_field_features = []
batch_aggregate_single_field_features = []
for d in get_dfs_by_corpus[corpus]():
    total_num += 1
    locator = d['locator']
    dataset_id = d['dataset_id']
    df = d['df']

    if read_existing_features and dataset_id in existing_feature_dataset_ids:
        continue
    print('\t Shape', df.shape)

    if(df.shape[1] > MAX_FIELDS):
        print('Exceeds max fields')
        continue

    try:
        single_field_features, parsed_fields = extract_single_field_features(df, locator=locator, dataset_id=dataset_id, MAX_FIELDS=MAX_FIELDS)
        aggregate_single_field_features = extract_aggregate_single_field_features(single_field_features, locator=locator, dataset_id=dataset_id)
    except Exception as e:
        print('Uncaught high-level exception:', e)
        continue

    batch_single_field_features.append(single_field_features)
    batch_aggregate_single_field_features.append(aggregate_single_field_features)
    valid_features += 1

    print('(Valid: {}/ Total: {})'.format(valid_features, total_num))


    if valid_features % batch_size == 0:
        flattened_batch_single_field_features = []
        for r in batch_single_field_features:
            flattened_batch_single_field_features.extend([ f for f in r if f['exists'] ])
        single_field_features_df = pd.DataFrame(flattened_batch_single_field_features)

        print(single_field_features_df.head())

        single_field_features_df.to_csv(single_field_features_file_name, mode='a', index=False, header=write_header)

        aggregate_single_field_features_df = pd.DataFrame(batch_aggregate_single_field_features)
        aggregate_single_field_features_df.to_csv(aggregate_single_field_features_file_name, mode='a', index=False, header=write_header)

        write_header = False
        batch_single_field_features = []
        batch_aggregate_single_field_features = []
