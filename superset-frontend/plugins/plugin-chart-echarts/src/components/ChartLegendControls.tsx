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
import { styled } from '@apache-superset/core/theme';
import { t } from '@apache-superset/core/translation';

const ControlsRow = styled.div<{ overlay?: boolean }>`
  ${({ overlay, theme }) => `
    align-items: center;
    background: ${theme.colorBgContainer};
    display: flex;
    gap: ${theme.sizeUnit}px;
    justify-content: flex-end;
    padding-bottom: ${theme.sizeUnit}px;
    position: ${overlay ? 'static' : 'sticky'};
    top: 0;
    z-index: 1;
  `}
`;

const ControlButton = styled.button`
  ${({ theme }) => `
    background: transparent;
    border: 1px solid ${theme.colorBorder};
    border-radius: ${theme.borderRadius}px;
    color: ${theme.colorText};
    cursor: pointer;
    font: inherit;
    padding: 0 ${theme.sizeUnit}px;

    &:hover {
      color: ${theme.colorPrimary};
    }
  `}
`;

const OpacityControl = styled.label`
  ${({ theme }) => `
    align-items: center;
    color: ${theme.colorTextSecondary};
    display: flex;
    gap: ${theme.sizeUnit}px;
    justify-content: flex-end;
    padding-bottom: ${theme.sizeUnit}px;
    white-space: nowrap;

    input {
      accent-color: ${theme.colorPrimary};
      cursor: pointer;
      width: 90px;
    }
  `}
`;

export type ChartLegendControlsProps = {
  highlightMode?: boolean;
  onAll: () => void;
  onHighlightToggle?: () => void;
  onInverse: () => void;
  onOtherSeriesOpacityChange?: (opacity: number) => void;
  otherSeriesOpacity?: number;
  overlay?: boolean;
  showHighlight?: boolean;
  showSelectors: boolean;
};

export default function ChartLegendControls({
  highlightMode = false,
  onAll,
  onHighlightToggle,
  onInverse,
  onOtherSeriesOpacityChange,
  otherSeriesOpacity = 0.2,
  overlay,
  showHighlight = false,
  showSelectors,
}: ChartLegendControlsProps) {
  const canShowHighlight = showHighlight && onHighlightToggle;
  if (!showSelectors && !canShowHighlight) {
    return null;
  }

  return (
    <>
      <ControlsRow overlay={overlay}>
        {showSelectors && (
          <>
            <ControlButton type="button" onClick={onAll}>
              {t('All')}
            </ControlButton>
            <ControlButton type="button" onClick={onInverse}>
              {t('Inverse')}
            </ControlButton>
          </>
        )}
        {canShowHighlight && (
          <ControlButton type="button" onClick={() => onHighlightToggle?.()}>
            {highlightMode ? t('Highlighting') : t('Highlight')}
          </ControlButton>
        )}
      </ControlsRow>
      {canShowHighlight && highlightMode && onOtherSeriesOpacityChange && (
        <OpacityControl>
          {t('Other series opacity')}
          <input
            aria-label={t('Other series opacity')}
            max="1"
            min="0"
            step="0.05"
            type="range"
            value={otherSeriesOpacity}
            onChange={event =>
              onOtherSeriesOpacityChange(Number(event.currentTarget.value))
            }
          />
          <span>{Math.round(otherSeriesOpacity * 100)}%</span>
        </OpacityControl>
      )}
    </>
  );
}
