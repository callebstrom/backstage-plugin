/*
 * Copyright 2021 The Backstage Authors
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
import React, { useCallback, useState } from "react";

import { TriggerDialog } from "../TriggerDialog";

import {Icon, IconButton} from "@backstage/canon";

/** @public */
export type TriggerIncidentButtonProps = {
  integrationKey: string | undefined;
  entityName: string;
  compact?: boolean;
  handleRefresh: () => void;
}

/** @public */
export function TriggerIncidentButton({ integrationKey, entityName, handleRefresh } : TriggerIncidentButtonProps) {
  const [dialogShown, setDialogShown] = useState<boolean>(false);

  const showDialog = useCallback(() => {
    setDialogShown(true);
  }, [setDialogShown]);
  const hideDialog = useCallback(() => {
    setDialogShown(false);
  }, [setDialogShown]);
  
  const disabled = !integrationKey;
  
  return (
    <>
      <IconButton
        onClick={showDialog}
        variant="secondary"
        aria-label="create-incident"
        icon={<Icon name="sun" />}
        disabled={disabled} />
      {integrationKey && (
        <TriggerDialog
          showDialog={dialogShown}
          handleDialog={hideDialog}
          integrationKey={integrationKey}
          serviceName={entityName}
          onIncidentCreated={handleRefresh}
        />
      )}
    </>
  );
}
