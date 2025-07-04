/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// eslint-disable-next-line @backstage/no-undeclared-imports
import React, { ReactNode, useCallback, useState } from "react";
import { Incidents } from "../Incident";
import { EscalationPolicy } from "../Escalation";
import useAsync from "react-use/lib/useAsync";
import { pagerDutyApiRef, UnauthorizedError } from "../../api";
import { MissingTokenError, ServiceNotFoundError } from "../Errors";
import { ChangeEvents } from "../ChangeEvents";

import { useApi } from "@backstage/core-plugin-api";
import { NotFoundError } from "@backstage/errors";
import {
  Progress,
  InfoCard,
} from "@backstage/core-components";
import { PagerDutyEntity } from "../../types";
import { ForbiddenError } from "../Errors/ForbiddenError";
import {
  InsightsCard,
  OpenServiceButton,
  ServiceStandardsCard,
  StatusCard,
  TriggerIncidentButton,
} from "../PagerDutyCardCommon";
import { useTheme } from "@material-ui/core/styles";
import { PagerDutyCardServiceResponse } from "../../api/types";

import PDCardComponent from "../canon-alternatives/card";

import { Flex, Grid, Heading, Tabs, Text } from "@backstage/canon"

const BasicCard = ({ children }: { children: ReactNode }) => (
  <InfoCard title="PagerDuty">{children}</InfoCard>
);

const OncallPerson = ({ service }: { service: PagerDutyCardServiceResponse | undefined }) => {
  return (
    <section className="cu-pt-2">
      <Text variant="body" color="secondary" weight="bold">ON CALL</Text>

      <EscalationPolicy
        data-testid="oncall-card"
        policyId={service!.policyId}
        policyUrl={service!.policyLink}
        policyName={service!.policyName}
        account={service!.account}
      />
    </section>
  );
}

/** @public */
export type PagerDutyCardProps = PagerDutyEntity & {
  readOnly?: boolean;
  disableChangeEvents?: boolean;
  disableOnCall?: boolean;
};

/** @public */
export const PagerDutyCard = (props: PagerDutyCardProps) => {
  const theme = useTheme();
  const { readOnly, disableChangeEvents, disableOnCall } = props;
  const api = useApi(pagerDutyApiRef);
  const [refreshIncidents, setRefreshIncidents] = useState<boolean>(false);
  const [refreshChangeEvents, setRefreshChangeEvents] =
    useState<boolean>(false);
  const [refreshStatus, setRefreshStatus] = useState<boolean>(false);

  const handleRefresh = useCallback(() => {
    setRefreshIncidents((x) => !x);
    setRefreshChangeEvents((x) => !x);
    setRefreshStatus((x) => !x);
  }, []);

  const {
    value: service,
    loading,
    error,
  } = useAsync(async () => {
    const { service: foundService } = await api.getServiceByPagerDutyEntity(
      props
    );

    const serviceStandards = await api.getServiceStandardsByServiceId(
      foundService.id,
      props.account
    );

    const serviceMetrics = await api.getServiceMetricsByServiceId(
      foundService.id,
      props.account
    );

    const result: PagerDutyCardServiceResponse = {
      id: foundService.id,
      account: props.account,
      name: foundService.name,
      url: foundService.html_url,
      policyId: foundService.escalation_policy.id,
      policyLink: foundService.escalation_policy.html_url as string,
      policyName: foundService.escalation_policy.name,
      status: foundService.status,
      standards:
        serviceStandards !== undefined ? serviceStandards.standards : undefined,
      metrics:
        serviceMetrics !== undefined ? serviceMetrics.metrics : undefined,
    };

    return result;
  }, [props]);

  if (error) {
    let errorNode: ReactNode;

    switch (error.constructor) {
      case UnauthorizedError:
        errorNode = <MissingTokenError />;
        break;
      case NotFoundError:
        errorNode = <ServiceNotFoundError />;
        break;
      default:
        errorNode = <ForbiddenError />;
    }

    return <BasicCard>{errorNode}</BasicCard>;
  }

  if (loading) {
    return (
      <PDCardComponent>
        <PDCardComponent.Header
          title={<Heading variant="title5">PagerDuty</Heading>}
          action={<></>} />
        <Progress />
      </PDCardComponent>
    );
  }

  return (
    <PDCardComponent>
      <PDCardComponent.Header
        title={<Heading variant="title5">PagerDuty</Heading>}
        action={
          !readOnly && props.integrationKey ? (
            <Flex gap="sm">
              <TriggerIncidentButton
                data-testid="trigger-incident-button"
                integrationKey={props.integrationKey}
                entityName={props.name}
                handleRefresh={handleRefresh}
              />
              <OpenServiceButton serviceUrl={service!.url} />
            </Flex>
          ) : (
            <OpenServiceButton serviceUrl={service!.url} />
          )
        }
      >
        <Grid.Root columns="12" mb="4">
          <Grid.Item colSpan="3">
            <Text variant="body" color="secondary" weight="bold">STATUS</Text>
          </Grid.Item>
          <Grid.Item colSpan="6">
            <Flex gap="md" direction="row">
              <Text variant="body" color="secondary" weight="bold">INSIGHTS</Text>
              <Text variant="body" color="secondary" weight="bold">(last 30 days)</Text>
            </Flex>
          </Grid.Item>
          <Grid.Item colSpan="3">
            <Text variant="body" color="secondary" weight="bold">STANDARDS</Text>
          </Grid.Item>
        </Grid.Root>

        <Grid.Root columns="12">
          <Grid.Item colSpan="3">
            <StatusCard
              serviceId={service!.id}
              account={service!.account}
              refreshStatus={refreshStatus}
            />
          </Grid.Item>
          
          <Grid.Item colSpan="6">
            <Grid.Root columns="12">
              <Grid.Item colSpan="4">
                <InsightsCard
                  count={
                    service?.metrics !== undefined && service.metrics.length > 0
                      ? service?.metrics[0].total_interruptions
                      : undefined
                  }
                  label="interruptions"
                  color={theme.palette.textSubtle}
                />
              </Grid.Item>
              <Grid.Item colSpan="4">
                <InsightsCard
                  count={
                    service?.metrics !== undefined && service.metrics.length > 0
                      ? service?.metrics[0].total_high_urgency_incidents
                      : undefined
                  }
                  label="high urgency"
                  color={theme.palette.warning.main}
                />
              </Grid.Item>
              <Grid.Item colSpan="4">
                <InsightsCard
                  count={
                    service?.metrics !== undefined && service?.metrics?.length > 0
                      ? service?.metrics[0].total_incident_count
                      : undefined
                  }
                  label="incidents"
                  color={theme.palette.error.main}
                />
              </Grid.Item>
            </Grid.Root>
          </Grid.Item>
          
          <Grid.Item colSpan="3">
            <ServiceStandardsCard
              total={
                service?.standards?.score !== undefined
                  ? service?.standards?.score?.total
                  : undefined
              }
              completed={
                service?.standards?.score !== undefined
                  ? service?.standards?.score?.passing
                  : undefined
              }
              standards={
                service?.standards !== undefined
                  ? service?.standards?.standards
                  : undefined
              }
            />
          </Grid.Item>
        </Grid.Root>
      </PDCardComponent.Header>

      <>
        <PDCardComponent>
          <Tabs.Root>
            <Tabs.List>
              <Tabs.Tab>Incidents</Tabs.Tab>
              {disableChangeEvents !== true && <Tabs.Tab>Change Events</Tabs.Tab>}
            </Tabs.List>

            <Tabs.Panel className="cu-p-4">
              <Incidents
                serviceId={service!.id}
                refreshIncidents={refreshIncidents}
                account={service!.account} />
            </Tabs.Panel>

            <Tabs.Panel className="cu-p-4">
              {disableChangeEvents !== true && <ChangeEvents
                data-testid="change-events"
                serviceId={service!.id}
                refreshEvents={refreshChangeEvents}
                account={service!.account} />}
            </Tabs.Panel>
          </Tabs.Root>
        </PDCardComponent>

        {disableOnCall !== true ? (<OncallPerson service={service} />) : (<></>)}
      </>
    </PDCardComponent>
  );
};
