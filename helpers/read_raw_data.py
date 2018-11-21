'''
Helper functions to read through raw data for each corpus. Each
is a generator that yields a single dataset and metadata in the form:

{
    'df'
    'locator',
    'dataset_id'
}
'''
import os
from os import listdir
from os.path import join
from collections import OrderedDict
import argparse
import gzip
import json
import chardet
import traceback

import numpy as np
import pandas as pd
from feature_extraction.general_helpers import clean_chunk
from feature_extraction.type_detection import detect_field_type, data_type_to_general_type, data_types, general_types

raw_data_dir = '../raw'

data_dirs = {
    'plotly': join(raw_data_dir, 'plotly'),
    'manyeyes': join(raw_data_dir, 'manyeyes'),
    'webtables': join(raw_data_dir, 'webtables'),
    'opendata': join(raw_data_dir, 'opendata')
}


CHUNK_SIZE = 500

def get_plotly_dfs(limit=None, exact_num_fields=None, min_fields=None, max_fields=None):
    corpus = 'plotly'
    base_dir = data_dirs[corpus]
    files = [ f for f in listdir(base_dir) if f.endswith('.tsv') ]
    for f in files[:limit]:
        raw_df_chunks = pd.read_csv(
            join(data_dirs[corpus], f),
            sep='\t',
            usecols=['fid', 'table_data', 'layout', 'chart_data'],
            error_bad_lines=False,
            warn_bad_lines=False,
            chunksize=CHUNK_SIZE,
            encoding='utf-8'
        )
        for chunk_num, chunk in enumerate(raw_df_chunks):
            chunk = clean_chunk(chunk)  
            for chart_num, chart_obj in chunk.iterrows():
                fid = chart_obj.fid 
                table_data = chart_obj.table_data
                fields = table_data[list(table_data.keys())[0]]['cols']  
                sorted_fields = sorted(fields.items(), key=lambda x: x[1]['order'])
                num_fields = len(sorted_fields)

                if exact_num_fields:
                    if num_fields != exact_num_fields: continue
                if min_fields:
                    if num_fields < min_fields: continue                    
                if max_fields:
                    if num_fields > max_fields: continue

                data_as_dict = OrderedDict()
                for k, v in sorted_fields:
                    data_as_dict[k] = pd.Series(v['data'])

                dataset_id = fid
                locator = f
                df = pd.DataFrame(data_as_dict)
                result = {
                    'df': df,
                    'dataset_id': dataset_id,
                    'locator': locator
                }
                yield result


def get_manyeyes_dfs(exact_num_fields=None, min_fields=None, max_fields=None):
    corpus = 'manyeyes'
    base_dir = data_dirs[corpus]
    files = []
    for year_dir in listdir(base_dir):
        for month_dir in listdir(join(base_dir, year_dir)):
            month_files = listdir(join(base_dir, year_dir, month_dir))
            files.append([ year_dir, month_dir, month_files ])

    for (year_dir, month_dir, month_files) in files:
        for i, file_name in enumerate(month_files):
            locator = join(year_dir, month_dir, file_name)

            full_file_path = join(base_dir, year_dir, month_dir, file_name)
            dataset_id = file_name

            try:
                df = pd.read_csv(
                    full_file_path,
                    error_bad_lines=False,
                    warn_bad_lines=False,
                    sep='\t',
                    encoding='utf-8'
                )

                num_fields = len(df.columns)

                if exact_num_fields:
                    if num_fields != exact_num_fields: continue
                if min_fields:
                    if num_fields < min_fields: continue
                if max_fields:
                    if num_fields > max_fields: continue

                result = {
                    'df': df,
                    'dataset_id': dataset_id,
                    'locator': locator
                }
                yield result

            except Exception as e:
                continue

def get_webtables_dfs(exact_num_fields=None, min_fields=None, max_fields=None):
    corpus = 'webtables'
    base_dir = data_dirs[corpus]    
    files = []
    for sub_dir in listdir(base_dir):
        if sub_dir.endswith(tuple(['.gz', '.lst', '.html'])): continue
        json_files = listdir(join(base_dir, sub_dir, 'warc'))
        files.append([ base_dir, sub_dir, json_files ])

    for (base_dir, sub_dir, json_files) in files:
        for i, file_name in enumerate(json_files):
            full_file_path = join(base_dir, sub_dir, 'warc', file_name)
            with gzip.open(full_file_path, 'rb') as f_in:

                locator = join(sub_dir, 'warc', file_name)
                for line_count, dataset in enumerate(f_in):
                    try:
                        data = json.loads(dataset.decode('utf-8'))
                    except UnicodeDecodeError:
                        encoding = chardet.detect(dataset)['encoding']
                        try:
                            data = json.loads(dataset.decode(encoding))
                        except Exception as e:
                            print('Cannot parse', e)
                    try:
                        if data['hasHeader'] and (data['headerPosition'] == 'FIRST_ROW'):
                            header_row_index = data.get('headerRowIndex', 0)
                            data_as_dict = OrderedDict()
                            for raw_cols in data['relation']:
                                header_row = raw_cols[header_row_index]
                                raw_cols.pop(header_row_index)

                                parsed_values = pd.Series([ None if (v == '-') else v for v in raw_cols ])
                                try:
                                    parsed_values = pd.to_numeric(parsed_values, errors='raise')
                                except:
                                    pass
                                #parsed_values = parsed_values.replace(value='-', None)
                                data_as_dict[header_row] = parsed_values

                            dataset_id = '{}-{}'.format(data['pageTitle'], data['tableNum'])    
                            df = pd.DataFrame(data_as_dict)

                            num_fields = len(df.columns)

                            if exact_num_fields:
                                if num_fields != exact_num_fields: continue
                            if min_fields:
                                if num_fields < min_fields: continue
                            if max_fields:
                                if num_fields > max_fields: continue

                            result = {
                                'df': df,
                                'dataset_id': dataset_id,
                                'locator': locator
                            }
                            yield result

                    except Exception as e:
                        print(e)
                        continue      

def get_opendata_dfs(exact_num_fields=None, min_fields=None, max_fields=None):
    corpus = 'opendata'
    base_dir = data_dirs[corpus]       
    files = []
    for portal_dir in listdir(base_dir):
        full_portal_dir = join(base_dir, portal_dir)
        for dataset_id_dir in listdir(full_portal_dir):
            full_dataset_id_dir = join(full_portal_dir, dataset_id_dir)
            for dataset_name in listdir(full_dataset_id_dir):
                full_dataset_path = join(full_dataset_id_dir, dataset_name)
                locator = join(portal_dir, dataset_id_dir)
                dataset_id = '{}__{}'.format(dataset_id_dir, dataset_name)

                engine = 'c'
                encoding = 'utf-8'
                sep=','
                while True:
                    try:
                        print(sep)
                        df = pd.read_csv(
                            full_dataset_path,
                            engine=engine,  # https://github.com/pandas-dev/pandas/issues/11166
                            error_bad_lines=False,
                            warn_bad_lines=False,
                            encoding=encoding,
                            sep=sep
                        )

                        num_fields = len(df.columns)
                        if num_fields == 1 and sep != ':':
                            if sep == ',': sep=';'
                            if sep == ';': sep='\t'
                            if sep == '\t': sep=':'
                        elif num_fields == 1 and sep == ':':
                            with open(full_dataset_path, 'r') as f:
                                head = [next(f) for x in range(100)]
                                head = ''.join(head)
                                for t in [ '<body>', 'html', 'DOCTYPE' ]:
                                    if t in head:
                                        print('is html')
                                        break
                            yield result

                        else:
                            if exact_num_fields:
                                if num_fields != exact_num_fields: continue
                            if max_fields:
                                if num_fields > max_fields: continue


                            result = {
                                'df': df,
                                'dataset_id': dataset_id,
                                'locator': locator
                            }

                            yield result
                            break

                    except UnicodeDecodeError as ude:
                        encoding = 'latin-1'
                    except pd.errors.ParserError as cpe:
                        engine = 'python'
                    except Exception as e:
                        print(e)
                        break

get_dfs_by_corpus = {
    'plotly': get_plotly_dfs,
    'manyeyes': get_manyeyes_dfs,
    'webtables': get_webtables_dfs,
    'opendata': get_opendata_dfs
}
