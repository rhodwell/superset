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
import { useMemo, useRef, useCallback } from 'react';
import {
  ContextMenuFilters,
  DataRecordValue,
  getColumnLabel,
  getNumberFormatter,
  getTimeFormatter,
  QueryFormColumn,
  QueryObjectFilterClause,
} from '@superset-ui/core';
import { BubbleChartTransformedProps } from './types';
import Echart from '../components/Echart';
import {
  EventHandlers,
  EchartsHandler,
  LegendOrientation,
  LegendType,
} from '../types';
import { useLegendEventHandlers } from '../utils/legendEventHandlers';
import { applyHighlightOpacity, formatSeriesName } from '../utils/series';
import {
  BubbleDatum,
  ENTITY_INDEX,
  getBubbleCrossFilterDataMask,
  getSelectedBubbleKeys,
  isBubbleDatum,
  SERIES_INDEX,
  toJsonSafeFilterValue,
} from './crossFilter';
import { useSeriesHighlight } from '../hooks/useSeriesHighlight';
import ChartLegendControls from '../components/ChartLegendControls';
import { styled } from '@apache-superset/core/theme';
import { TIMESERIES_CONSTANTS } from '../constants';

const noop = () => {};

const BUBBLE_LEGEND_CONTROLS_WIDTH = 240;

const BubbleLegendControlsOverlay = styled.div`
  position: absolute;
  right: 8px;
  top: 0;
  width: ${BUBBLE_LEGEND_CONTROLS_WIDTH}px;
  z-index: 2;
`;

type BubbleEvent = {
  componentType?: string;
  data?: unknown;
  event?: { stop: () => void; event: PointerEvent };
};

function buildDrillFilters(
  entity: QueryFormColumn,
  series: QueryFormColumn | undefined,
  datum: BubbleDatum,
  dateFormat: string | undefined,
  coltypeMapping: BubbleChartTransformedProps['coltypeMapping'],
): QueryObjectFilterClause[] {
  const columns: Array<{ col: QueryFormColumn; value: DataRecordValue }> = [
    { col: entity, value: datum[ENTITY_INDEX] },
  ];
  if (series) {
    columns.push({ col: series, value: datum[SERIES_INDEX] });
  }
  const timeFormatter = getTimeFormatter(dateFormat);
  const numberFormatter = getNumberFormatter();
  return columns.map(({ col, value }) => {
    const formattedVal = formatSeriesName(value, {
      timeFormatter,
      numberFormatter,
      coltype: coltypeMapping?.[getColumnLabel(col)],
    });
    if (value == null) {
      return { col, op: 'IS NULL' as const, formattedVal };
    }
    return {
      col,
      op: '==' as const,
      val: toJsonSafeFilterValue(value),
      formattedVal,
    };
  });
}

export default function EchartsBubble(props: BubbleChartTransformedProps) {
  const {
    height,
    width,
    echartOptions,
    refs,
    formData,
    emitCrossFilters,
    filterState,
    setDataMask = noop,
    onContextMenu,
    coltypeMapping,
    onLegendStateChanged,
    onLegendScroll,
  } = props;
  const { entity, series, dateFormat } = formData;

  const crossFilterHandlers: EventHandlers = useMemo(() => {
    const selectedKeys = getSelectedBubbleKeys(filterState?.selectedValues);
    const seriesColumn = series || undefined;

    const crossFilterFor = (datum: BubbleDatum) =>
      getBubbleCrossFilterDataMask({
        entity,
        series: seriesColumn,
        datum,
        selectedKeys,
        coltypeMapping,
        dateFormat,
      });

    return {
      click: (event: BubbleEvent) => {
        if (!emitCrossFilters || !isBubbleDatum(event.data)) {
          return;
        }
        const { dataMask } = crossFilterFor(event.data);
        setDataMask(dataMask);
      },
      contextmenu: (event: BubbleEvent) => {
        if (!onContextMenu || !isBubbleDatum(event.data)) {
          return;
        }
        event.event?.stop();
        const pointerEvent = event.event?.event;
        if (!pointerEvent) {
          return;
        }
        // The context menu types only binary operators. IS NULL is unary, and
        // both drill paths forward `op` to the query unchanged.
        const drillFilters = buildDrillFilters(
          entity,
          seriesColumn,
          event.data,
          dateFormat,
          coltypeMapping,
        ) as NonNullable<ContextMenuFilters['drillToDetail']>;
        onContextMenu(pointerEvent.clientX, pointerEvent.clientY, {
          drillToDetail: drillFilters,
          crossFilter: crossFilterFor(event.data),
          drillBy: {
            filters: drillFilters,
            groupbyFieldName: 'entity',
          },
        });
      },
    };
  }, [
    coltypeMapping,
    dateFormat,
    emitCrossFilters,
    entity,
    filterState?.selectedValues,
    onContextMenu,
    series,
    setDataMask,
  ]);

  const echartRef = useRef<EchartsHandler | null>(null);
  refs.echartRef = echartRef;
  const dispatchLegendAction = useCallback(
    (action: { name?: string; seriesName?: string; type: string }) => {
      echartRef.current?.getEchartInstance()?.dispatchAction(action);
    },
    [],
  );

  const {
    highlightMode,
    highlightedSeriesNames,
    otherSeriesOpacity,
    setOtherSeriesOpacity,
    toggleHighlightMode,
    getLegendSelectChangeHandler,
  } = useSeriesHighlight({ echartRef, dispatchLegendAction });

  const chartEchartOptions = useMemo(() => {
    if (
      !highlightMode ||
      highlightedSeriesNames.length === 0 ||
      !Array.isArray(echartOptions.series)
    ) {
      return echartOptions;
    }

    return {
      ...echartOptions,
      series: applyHighlightOpacity(
        echartOptions.series,
        highlightedSeriesNames,
        otherSeriesOpacity,
      ),
    };
  }, [
    echartOptions,
    highlightMode,
    highlightedSeriesNames,
    otherSeriesOpacity,
  ]);

  const legendEventHandlers = useLegendEventHandlers(
    onLegendStateChanged,
    onLegendScroll,
  );
  const handleLegendSelectChange = getLegendSelectChangeHandler();

  const eventHandlers = {
    ...legendEventHandlers,
    ...crossFilterHandlers,
    legendselectchanged: params => {
      if (!highlightMode || typeof params.name !== 'string') {
        legendEventHandlers.legendselectchanged(params);
        return;
      }
      handleLegendSelectChange(params);
    },
  };

  const shouldOverlayLegendControls =
    height > TIMESERIES_CONSTANTS.compactChartHeight &&
    formData.showLegend &&
    formData.legendType === LegendType.Scroll &&
    formData.legendOrientation === LegendOrientation.Top;

  const chartLegendControls = (
    <ChartLegendControls
      highlightMode={highlightMode}
      onAll={() => dispatchLegendAction({ type: 'legendAllSelect' })}
      onHighlightToggle={toggleHighlightMode}
      onInverse={() => dispatchLegendAction({ type: 'legendInverseSelect' })}
      onOtherSeriesOpacityChange={setOtherSeriesOpacity}
      otherSeriesOpacity={otherSeriesOpacity}
      overlay={shouldOverlayLegendControls}
      showHighlight
      showSelectors={formData.showSelectorLegend !== false}
    />
  );

  const chart = (
    <Echart
      height={height}
      width={width}
      echartOptions={chartEchartOptions}
      eventHandlers={eventHandlers}
      ref={echartRef}
      refs={refs}
      vizType={formData.vizType}
    />
  );

  return shouldOverlayLegendControls ? (
    <div style={{ position: 'relative', height, width }}>
      <BubbleLegendControlsOverlay>
        {chartLegendControls}
      </BubbleLegendControlsOverlay>
      {chart}
    </div>
  ) : (
    <>
      {chartLegendControls}
      {chart}
    </>
  );
}
