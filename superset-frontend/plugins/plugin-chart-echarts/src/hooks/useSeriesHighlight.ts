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
import { useCallback, useRef, useState } from 'react';
import type { EchartsHandler } from '../types';

export type UseSeriesHighlightReturn = {
  highlightMode: boolean;
  highlightedSeriesNames: string[];
  otherSeriesOpacity: number;
  selectHighlightedSeries: (name: string) => void;
  setOtherSeriesOpacity: (opacity: number) => void;
  toggleHighlightMode: () => void;
  getLegendSelectChangeHandler: () => (params: {
    name: string;
    selected: Record<string, boolean>;
  }) => void;
};

type Dependencies = {
  echartRef: React.MutableRefObject<EchartsHandler | null>;
  dispatchLegendAction: (action: {
    name?: string;
    seriesName?: string;
    type: string;
  }) => void;
};

export function useSeriesHighlight({
  echartRef,
  dispatchLegendAction,
}: Dependencies): UseSeriesHighlightReturn {
  const [highlightMode, setHighlightMode] = useState(false);
  const [highlightedSeriesNames, setHighlightedSeriesNames] = useState<
    string[]
  >([]);
  const [otherSeriesOpacity, setOtherSeriesOpacity] = useState(0.2);
  const restoringLegendSelectionRef = useRef(false);

  const selectHighlightedSeries = useCallback(
    (name: string) => {
      setHighlightedSeriesNames(current =>
        current.includes(name)
          ? current.filter(n => n !== name)
          : [...current, name],
      );
      dispatchLegendAction({ type: 'downplay' });
    },
    [dispatchLegendAction],
  );

  const toggleHighlightMode = useCallback(() => {
    if (highlightMode) {
      setHighlightMode(false);
      setHighlightedSeriesNames([]);
      dispatchLegendAction({ type: 'downplay' });
      return;
    }
    setHighlightMode(true);
  }, [dispatchLegendAction, highlightMode]);

  const getLegendSelectChangeHandler = useCallback(
    () => (params: { name: string; selected: Record<string, boolean> }) => {
      if (restoringLegendSelectionRef.current) {
        return;
      }
      if (!highlightMode || typeof params.name !== 'string') {
        return;
      }

      const { name, selected } = params;
      const chart = echartRef.current?.getEchartInstance();
      const selection = selected?.[name];
      if (chart && typeof selection === 'boolean') {
        restoringLegendSelectionRef.current = true;
        try {
          chart.dispatchAction({
            name,
            type: selection ? 'legendUnSelect' : 'legendSelect',
          });
        } finally {
          restoringLegendSelectionRef.current = false;
        }
      }
      selectHighlightedSeries(name);
    },
    [highlightMode, echartRef, selectHighlightedSeries],
  );

  return {
    highlightMode,
    highlightedSeriesNames,
    otherSeriesOpacity,
    selectHighlightedSeries,
    setOtherSeriesOpacity,
    toggleHighlightMode,
    getLegendSelectChangeHandler,
  };
}
