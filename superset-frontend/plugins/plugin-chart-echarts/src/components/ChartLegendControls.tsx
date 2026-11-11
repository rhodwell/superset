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

const ControlsRow = styled.div`
  ${({ theme }) => `
    align-items: center;
    background: ${theme.colorBgContainer};
    display: flex;
    gap: ${theme.sizeUnit}px;
    justify-content: flex-end;
    padding-bottom: ${theme.sizeUnit}px;
    position: sticky;
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

export type ChartLegendControlsProps = {
  highlightMode?: boolean;
  onAll: () => void;
  onHighlightToggle?: () => void;
  onInverse: () => void;
  showHighlight?: boolean;
  showSelectors: boolean;
};

export default function ChartLegendControls({
  highlightMode = false,
  onAll,
  onHighlightToggle,
  onInverse,
  showHighlight = false,
  showSelectors,
}: ChartLegendControlsProps) {
  if (!showSelectors) {
    return null;
  }

  return (
    <ControlsRow>
      <ControlButton type="button" onClick={onAll}>
        {t('All')}
      </ControlButton>
      <ControlButton type="button" onClick={onInverse}>
        {t('Inverse')}
      </ControlButton>
      {showHighlight && onHighlightToggle && (
        <ControlButton type="button" onClick={onHighlightToggle}>
          {highlightMode ? t('Highlighting') : t('Highlight')}
        </ControlButton>
      )}
    </ControlsRow>
  );
}
