import {useMemo, useState} from 'react';
import styled from 'styled-components';

import Canvas from './canvas';
import NumberField from './components/fields/number';
import IconDone from './icons/done';

const inputProps = {
  inputWidth: '2.25rem',
  rowLayout: true,
  step: 0.05,
  minValue: 0,
  maxValue: 1,
};

function App() {
  const [population, setPopulation] = useState({error: 500, performance: 5000});
  function onPopulationChange(name: keyof typeof population, value: number) {
    setPopulation({
      ...population,
      [name]: value,
    });
  }

  const [filterRates, setFilterRates] = useState({
    sampleRate: 0.5,
    traceSampleRate: 0.2,
    serverError: 1,
    serverPerformance: 0.5,
    serverReleaseV1: 1,
    serverReleaseV2: 1,
    serverEnvironmentProd: 1,
    serverEnvironmentStage: 1,
  });
  function onFilterRateChange(name: keyof typeof filterRates, value: number) {
    setFilterRates({
      ...filterRates,
      [name]: value,
    });
  }

  const [inboundFilters, setInboundFilters] = useState({
    localhost: true,
    browserExtensions: true,
    webCrawlers: true,
    legacyBrowsers: true,
  });
  function onInboundFilterChange(name: keyof typeof inboundFilters, value: boolean) {
    setInboundFilters({
      ...inboundFilters,
      [name]: value,
    });
  }

  const inboundFilterRate = useMemo(
    () =>
      1 -
      (inboundFilters.localhost ? 0.01 : 0) -
      (inboundFilters.browserExtensions ? 0.01 : 0) -
      (inboundFilters.webCrawlers ? 0.01 : 0) -
      (inboundFilters.legacyBrowsers ? 0.04 : 0),
    [inboundFilters]
  );

  return (
    <Wrap>
      <SamplingGrid>
        <Column>
          <SectionTitle>Initial Population</SectionTitle>
          <NumberField
            rowLayout
            step={1}
            minValue={1}
            inputWidth="5rem"
            label="Errors"
            value={population.error}
            onChange={val => onPopulationChange('error', val)}
          />
          <NumberField
            rowLayout
            step={1}
            minValue={1}
            inputWidth="5rem"
            label="Transactions"
            value={population.performance}
            onChange={val => onPopulationChange('performance', val)}
          />
        </Column>
        <Column>
          <SectionTitle>Client-Side</SectionTitle>
          <NumberField
            label="sampleRate"
            description="Error sample rate."
            value={filterRates.sampleRate}
            onChange={val => onFilterRateChange('sampleRate', val)}
            {...inputProps}
          />
          <NumberField
            label="traceSampleRate"
            description="Transaction sample rate."
            value={filterRates.traceSampleRate}
            onChange={val => onFilterRateChange('traceSampleRate', val)}
            {...inputProps}
          />
        </Column>
        <Column>
          <SectionTitle>Server-Side</SectionTitle>
          <SectionSubtitle>Inbound Data Filters</SectionSubtitle>
          <CheckboxLabel>
            <CheckInput
              type="checkbox"
              checked={inboundFilters.legacyBrowsers}
              onChange={e => onInboundFilterChange('legacyBrowsers', e.target.checked)}
            />
            <Checkbox checked={inboundFilters.legacyBrowsers}>
              <IconDone />
            </Checkbox>
            Legacy browsers
          </CheckboxLabel>
          <CheckboxLabel>
            <CheckInput
              type="checkbox"
              checked={inboundFilters.browserExtensions}
              onChange={e => onInboundFilterChange('browserExtensions', e.target.checked)}
            />
            <Checkbox checked={inboundFilters.browserExtensions}>
              <IconDone />
            </Checkbox>
            Browser extensions
          </CheckboxLabel>
          <CheckboxLabel>
            <CheckInput
              type="checkbox"
              checked={inboundFilters.webCrawlers}
              onChange={e => onInboundFilterChange('webCrawlers', e.target.checked)}
            />
            <Checkbox checked={inboundFilters.webCrawlers}>
              <IconDone />
            </Checkbox>
            Web crawlers
          </CheckboxLabel>
          <CheckboxLabel>
            <CheckInput
              type="checkbox"
              checked={inboundFilters.localhost}
              onChange={e => onInboundFilterChange('localhost', e.target.checked)}
            />
            <Checkbox checked={inboundFilters.localhost}>
              <IconDone />
            </Checkbox>
            localhost
          </CheckboxLabel>

          <SectionSubtitle>Custom Rules</SectionSubtitle>
          <NumberField
            label="All incoming errors"
            description="Not available yet."
            value={filterRates.serverError}
            onChange={val => onFilterRateChange('serverError', val)}
            isDisabled
            {...inputProps}
          />
          <NumberField
            label="All incoming transactions"
            value={filterRates.serverPerformance}
            onChange={val => onFilterRateChange('serverPerformance', val)}
            {...inputProps}
          />
          <NumberField
            label="Release = v1"
            description="Sample rate for transactions from V1."
            value={filterRates.serverReleaseV1}
            onChange={val => onFilterRateChange('serverReleaseV1', val)}
            {...inputProps}
          />
          <NumberField
            label="Release = v2"
            description="Sample rate for transactions from V2."
            value={filterRates.serverReleaseV2}
            onChange={val => onFilterRateChange('serverReleaseV2', val)}
            {...inputProps}
          />
          <NumberField
            label="Environment = prod"
            description="Sample rate for transactions in prod."
            value={filterRates.serverEnvironmentProd}
            onChange={val => onFilterRateChange('serverEnvironmentProd', val)}
            {...inputProps}
          />
          <NumberField
            label="Environment = stage"
            description="Sample rate for transactions from stage."
            value={filterRates.serverEnvironmentStage}
            onChange={val => onFilterRateChange('serverEnvironmentStage', val)}
            {...inputProps}
          />
        </Column>
      </SamplingGrid>

      <Canvas
        population={population}
        filterRates={filterRates}
        inboundFilterRate={inboundFilterRate}
      />
    </Wrap>
  );
}

export default App;

const Wrap = styled('div')`
  max-width: 64rem;
  background: ${p => p.theme.background};
  border: solid 1px ${p => p.theme.innerBorder};
  border-radius: ${p => p.theme.borderRadiusLarge};
  padding: ${p => p.theme.space[4]};
  margin: 0 auto;
`;

const SamplingGrid = styled('div')`
  display: grid;
  grid-template-columns: 25% 30% 45%;
  margin-bottom: ${p => p.theme.space[4]};
`;

const Column = styled('div')`
  &:not(:last-child) {
    border-right: solid 1px ${p => p.theme.innerBorder};
    padding-right: ${p => p.theme.space[3]};
  }
  &:not(:first-child) {
    padding-left: ${p => p.theme.space[3]};
  }
`;

// const FilterWrap = styled('div')`
//   margin-bottom: ${p => p.theme.space[5]};
// `;

// const FilterGrid = styled('div')`
//   display: grid;
//   grid-template-columns: 1fr 1fr;
// `;

// const Explanation = styled('p')`
//   display: block;
//   color: ${p => p.theme.subText};
//   max-width: 24em;
//   margin-bottom: ${p => p.theme.space[3]};
// `;

const SectionTitle = styled('h3')``;

const SectionSubtitle = styled('h5')`
  color: ${p => p.theme.subText};
  text-transform: uppercase;

  margin-bottom: 0;
  &:not(:first-of-type) {
    margin-top: ${p => p.theme.space[4]};
  }
  &:first-of-type {
    margin-top: ${p => p.theme.space[2]};
  }
`;

const CheckboxLabel = styled('label')`
  display: flex;
  margin: ${p => p.theme.space[1]} 0;
  cursor: pointer;
  &:first-of-type {
    padding-top: ${p => p.theme.space[0.5]};
  }
`;

const CheckInput = styled('input')`
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
`;

const Checkbox = styled('div')<{checked: boolean}>`
  width: 1rem;
  height: 1rem;
  border-radius: calc(${p => p.theme.borderRadius} / 2);
  margin-right: ${p => p.theme.space[1]};
  border: solid 1px ${p => p.theme.border};

  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;

  ${p =>
    p.checked &&
    `
    background-color: ${p.theme.active};
    border-color: ${p.theme.active};
    color: ${p.theme.white};
  `}
`;

// const Code = styled('p')`
//   font-family: 'Roboto Mono', monospace;
// `;
