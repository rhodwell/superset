/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { supersetTheme } from '@apache-superset/core/theme';
import { logging } from '@apache-superset/core/utils';
import {
  ChartProps,
  QueryData,
  QueryFormData,
  VizType,
} from '@superset-ui/core';
import type { ControlPanelState } from '@superset-ui/chart-controls';
import transformTimeseries from '../Timeseries/transformProps';
import type { EchartsTimeseriesChartProps } from '../Timeseries/types';
import transformBubble from '../Bubble/transformProps';
import type { EchartsBubbleChartProps } from '../Bubble/types';

type CachedSeries = {
  formData: QueryFormData;
  datasource: ControlPanelState['datasource'];
  names: string[] | undefined;
};

const seriesCache = new WeakMap<object, CachedSeries>();

type HighlightSeriesResolver = (props: ChartProps) => string[] | undefined;

const resolveTimeseries: HighlightSeriesResolver = props =>
  transformTimeseries(
    props as unknown as EchartsTimeseriesChartProps,
  ).legendData?.map(String);

const resolveBubble: HighlightSeriesResolver = props => {
  const { echartOptions } = transformBubble(
    props as unknown as EchartsBubbleChartProps,
  );
  const legend = echartOptions.legend as { data?: string[] } | undefined;
  return legend?.data;
};

const seriesResolvers: Partial<Record<string, HighlightSeriesResolver>> = {
  [VizType.Line]: resolveTimeseries,
  [VizType.Scatter]: resolveTimeseries,
  [VizType.Bubble]: resolveBubble,
};

/**
 * Return the series names shown in the chart legend
 */
export function getHighlightSeriesNames(
  explore: ControlPanelState,
  chart?: {
    queriesResponse?: QueryData[] | null;
    latestQueryFormData?: QueryFormData;
  },
): string[] | undefined {
  const responses = chart?.queriesResponse;
  if (!responses?.length) return undefined;
  const formData = chart?.latestQueryFormData?.viz_type
    ? chart.latestQueryFormData
    : explore.form_data;
  const resolveSeries = seriesResolvers[formData.viz_type];
  if (!resolveSeries) return undefined;
  const cached = seriesCache.get(responses);
  if (
    cached?.formData === formData &&
    cached.datasource === explore.datasource
  ) {
    return cached.names;
  }

  let names: string[] | undefined;
  try {
    // time-series transform mutates label_map, so clone the response
    const props = new ChartProps({
      theme: supersetTheme,
      formData,
      datasource: explore.datasource ?? {},
      queriesData: structuredClone(responses),
    });
    names = resolveSeries(props);
  } catch (err) {
    logging.warn('Unable to determine highlight series', err);
  }
  seriesCache.set(responses, {
    formData,
    datasource: explore.datasource,
    names,
  });
  return names;
}
