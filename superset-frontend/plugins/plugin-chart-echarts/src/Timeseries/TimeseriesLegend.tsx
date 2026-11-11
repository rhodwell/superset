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
import { memo } from 'react';
import { styled } from '@apache-superset/core/theme';
import { LegendOrientation } from '../types';
import ChartLegendControls from '../components/ChartLegendControls';
import TimeseriesLegendIcon, {
  LEGEND_ICON_OVERFLOW_PX,
} from './TimeseriesLegendIcon';
import type { TimeseriesCustomLegend } from './types';

const LegendViewport = styled.div<{ maxHeight: number; maxWidth?: number }>`
  ${({ maxHeight, maxWidth, theme }) => `
    box-sizing: border-box;
    color: ${theme.colorTextSecondary};
    font-size: ${theme.fontSizeSM}px;
    max-height: ${maxHeight}px;
    ${maxWidth !== undefined && maxWidth > 0 ? `max-width: ${maxWidth}px;` : ''}
    overflow-x: hidden;
    overflow-y: auto;
    padding: ${theme.sizeUnit}px ${theme.sizeUnit * 2}px;
    width: ${maxWidth !== undefined && maxWidth > 0 ? 'auto' : '100%'};
  `}
`;

const ItemList = styled.ul<{ isVertical?: boolean; underSelectors: boolean }>`
  ${({ isVertical, theme, underSelectors }) => `
    align-items: flex-start;
    display: flex;
    flex-direction: ${isVertical ? 'column' : 'row'};
    flex-wrap: ${isVertical ? 'nowrap' : 'wrap'};
    gap: ${theme.sizeUnit * 2}px;
    list-style: none;
    margin: 0;
    // Leave room for icons that overflow their box, so the sticky selector
    // row above does not paint over them.
    padding: ${underSelectors ? LEGEND_ICON_OVERFLOW_PX : 0}px 0 0;
  `}
`;

const LegendItem = styled.li`
  min-width: 0;
`;

const ItemButton = styled.button<{ selected: boolean }>`
  ${({ selected, theme }) => `
    align-items: center;
    appearance: none;
    background: none;
    border: none;
    // Same tokens the ECharts legend theme uses for its labels (Echart.tsx).
    color: ${selected ? theme.colorTextSecondary : theme.colorTextDisabled};
    cursor: pointer;
    display: inline-flex;
    font: inherit;
    gap: ${theme.sizeUnit}px;
    max-width: 100%;
    padding: 0;
    text-align: left;

    &:disabled {
      cursor: default;
    }
  `}
`;

const Label = styled.span<{ truncate?: boolean }>`
  ${({ truncate }) =>
    truncate
      ? `
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `
      : `
    overflow-wrap: anywhere;
    white-space: pre-line;
  `}
`;

const RowBreak = styled.li`
  flex-basis: 100%;
  height: 0;
`;

export type TimeseriesLegendProps = TimeseriesCustomLegend & {
  highlightedSeriesName: string | null;
  highlightMode: boolean;
  maxHeight: number;
  // Bounds vertical (Left/Right) legends, whose labels truncate to fit.
  maxWidth?: number;
  onAll: () => void;
  onHighlightToggle: () => void;
  onInverse: () => void;
  onSelectHighlight: (name: string) => void;
  onToggle: (name: string) => void;
};

function TimeseriesLegend({
  highlightedSeriesName,
  highlightMode,
  items,
  maxHeight,
  maxWidth,
  onAll,
  onHighlightToggle,
  onInverse,
  onSelectHighlight,
  onToggle,
  orientation,
  showHighlight,
  showSelectors,
}: TimeseriesLegendProps) {
  const isVertical =
    orientation === LegendOrientation.Left ||
    orientation === LegendOrientation.Right;
  const noSpace =
    maxHeight <= 0 || (isVertical && maxWidth !== undefined && maxWidth <= 0);

  if (items.length === 0 || noSpace) {
    return null;
  }

  return (
    <LegendViewport
      data-test="timeseries-custom-legend"
      maxHeight={maxHeight}
      maxWidth={isVertical ? maxWidth : undefined}
    >
      <ChartLegendControls
        highlightMode={highlightMode}
        onAll={onAll}
        onHighlightToggle={onHighlightToggle}
        onInverse={onInverse}
        showHighlight={showHighlight}
        showSelectors={showSelectors}
      />
      <ItemList isVertical={isVertical} underSelectors={showSelectors}>
        {items.map((item, index) =>
          // ECharts treats these exact values as row-break sentinels, which
          // only mean anything to the wrapping horizontal layout.
          item.name === '' || item.name === '\n' ? (
            isVertical ? null : (
              <RowBreak key={`row-break-${item.name}-${index}`} />
            )
          ) : (
            <LegendItem key={item.name}>
              <ItemButton
                aria-pressed={
                  highlightMode
                    ? highlightedSeriesName === item.name
                    : item.selected
                }
                disabled={!item.interactive}
                selected={
                  highlightMode
                    ? highlightedSeriesName === item.name
                    : item.selected
                }
                type="button"
                onClick={() => {
                  if (item.interactive) {
                    if (highlightMode) {
                      onSelectHighlight(item.name);
                    } else {
                      onToggle(item.name);
                    }
                  }
                }}
              >
                <TimeseriesLegendIcon
                  color={item.color}
                  icon={item.icon}
                  selected={item.selected}
                />
                <Label
                  title={isVertical ? item.name : undefined}
                  truncate={isVertical}
                >
                  {item.name}
                </Label>
              </ItemButton>
            </LegendItem>
          ),
        )}
      </ItemList>
    </LegendViewport>
  );
}

export default memo(TimeseriesLegend);
