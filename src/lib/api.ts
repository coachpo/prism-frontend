import { ApiError, getApiProfileId, setApiProfileId } from "./api/core";
import { auth, settings } from "./api/authSettings";
import {
  audit,
  config,
  loadbalance,
  settingsCosting,
  stats,
} from "./api/observability";
import {
  connections,
  endpoints,
  models,
  pricingTemplates,
  profiles,
  providers,
} from "./api/management";

export { ApiError, getApiProfileId, setApiProfileId };

export const api = {
  audit,
  auth,
  config,
  connections,
  endpoints,
  loadbalance,
  models,
  pricingTemplates,
  profiles,
  providers,
  settings: {
    ...settings,
    costing: settingsCosting,
  },
  stats,
};
