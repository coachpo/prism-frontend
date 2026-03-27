import type {
  Connection,
  ConnectionCreate,
  LoadbalanceStrategy,
  LoadbalanceStrategyCreate,
  LoadbalanceStrategyUpdate,
  ModelConnectionsBatchParams,
  ModelConnectionsBatchResponse,
  ConnectionDropdownResponse,
  ConnectionOwnerResponse,
  ConnectionPricingTemplateUpdate,
  ConnectionUpdate,
  Endpoint,
  EndpointModelsBatchParams,
  EndpointModelsBatchResponse,
  EndpointCreate,
  EndpointUpdate,
  HealthCheckResponse,
  ModelConfig,
  ModelConfigCreate,
  ModelConfigListItem,
  ModelConfigUpdate,
  PricingTemplate,
  PricingTemplateConnectionsResponse,
  PricingTemplateCreate,
  PricingTemplateUpdate,
  Profile,
  ProfileActivateRequest,
  ProfileCreate,
  ProfileUpdate,
  VendorModelUsageItem,
  Vendor,
  VendorCreate,
  VendorUpdate,
} from "../types";
import { request } from "./core";

export const profiles = {
  list: () => request<Profile[]>("/api/profiles"),
  getActive: () => request<Profile>("/api/profiles/active"),
  create: (data: ProfileCreate) =>
    request<Profile>("/api/profiles", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: ProfileUpdate) =>
    request<Profile>(`/api/profiles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: number) => request<void>(`/api/profiles/${id}`, { method: "DELETE" }),
  activate: (id: number, payload: ProfileActivateRequest) =>
    request<Profile>(`/api/profiles/${id}/activate`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const vendors = {
  list: () => request<Vendor[]>("/api/vendors"),
  get: (id: number) => request<Vendor>(`/api/vendors/${id}`),
  create: (data: VendorCreate) =>
    request<Vendor>("/api/vendors", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: VendorUpdate) =>
    request<Vendor>(`/api/vendors/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  models: (id: number) => request<VendorModelUsageItem[]>(`/api/vendors/${id}/models`),
  delete: (id: number) => request<void>(`/api/vendors/${id}`, { method: "DELETE" }),
};

export const models = {
  list: () => request<ModelConfigListItem[]>("/api/models"),
  byEndpoints: (data: EndpointModelsBatchParams) =>
    request<EndpointModelsBatchResponse>("/api/models/by-endpoints", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  byEndpoint: (endpointId: number) =>
    request<ModelConfigListItem[]>(`/api/models/by-endpoint/${endpointId}`),
  get: (id: number) => request<ModelConfig>(`/api/models/${id}`),
  create: (data: ModelConfigCreate) =>
    request<ModelConfig>("/api/models", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: ModelConfigUpdate) =>
    request<ModelConfig>(`/api/models/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) => request<void>(`/api/models/${id}`, { method: "DELETE" }),
};

export const loadbalanceStrategies = {
  list: () => request<LoadbalanceStrategy[]>("/api/loadbalance/strategies"),
  get: (id: number) => request<LoadbalanceStrategy>(`/api/loadbalance/strategies/${id}`),
  create: (data: LoadbalanceStrategyCreate) =>
    request<LoadbalanceStrategy>("/api/loadbalance/strategies", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: LoadbalanceStrategyUpdate) =>
    request<LoadbalanceStrategy>(`/api/loadbalance/strategies/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<{ deleted: boolean }>(`/api/loadbalance/strategies/${id}`, {
      method: "DELETE",
    }),
};

export const endpoints = {
  list: () => request<Endpoint[]>("/api/endpoints"),
  connections: () => request<ConnectionDropdownResponse>("/api/endpoints/connections"),
  create: (data: EndpointCreate) =>
    request<Endpoint>("/api/endpoints", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: EndpointUpdate) =>
    request<Endpoint>(`/api/endpoints/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  movePosition: (id: number, toIndex: number) =>
    request<Endpoint[]>(`/api/endpoints/${id}/position`, {
      method: "PATCH",
      body: JSON.stringify({ to_index: toIndex }),
    }),
  duplicate: (id: number) =>
    request<Endpoint>(`/api/endpoints/${id}/duplicate`, {
      method: "POST",
    }),
  delete: (id: number) => request<void>(`/api/endpoints/${id}`, { method: "DELETE" }),
};

export const connections = {
  list: (modelConfigId: number) =>
    request<Connection[]>(`/api/models/${modelConfigId}/connections`),
  byModels: (data: ModelConnectionsBatchParams) =>
    request<ModelConnectionsBatchResponse>("/api/models/connections/batch", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  create: (modelConfigId: number, data: ConnectionCreate) =>
    request<Connection>(`/api/models/${modelConfigId}/connections`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: ConnectionUpdate) =>
    request<Connection>(`/api/connections/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  movePriority: (modelConfigId: number, connectionId: number, toIndex: number) =>
    request<Connection[]>(
      `/api/models/${modelConfigId}/connections/${connectionId}/priority`,
      {
        method: "PATCH",
        body: JSON.stringify({ to_index: toIndex }),
      }
    ),
  delete: (id: number) => request<void>(`/api/connections/${id}`, { method: "DELETE" }),
  healthCheck: (id: number) =>
    request<HealthCheckResponse>(`/api/connections/${id}/health-check`, {
      method: "POST",
    }),
  owner: (id: number) => request<ConnectionOwnerResponse>(`/api/connections/${id}/owner`),
  setPricingTemplate: (id: number, data: ConnectionPricingTemplateUpdate) =>
    request<Connection>(`/api/connections/${id}/pricing-template`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

export const pricingTemplates = {
  list: () => request<PricingTemplate[]>("/api/pricing-templates"),
  get: (id: number) => request<PricingTemplate>(`/api/pricing-templates/${id}`),
  create: (data: PricingTemplateCreate) =>
    request<PricingTemplate>("/api/pricing-templates", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: PricingTemplateUpdate) =>
    request<PricingTemplate>(`/api/pricing-templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) => request<void>(`/api/pricing-templates/${id}`, { method: "DELETE" }),
  connections: (id: number) =>
    request<PricingTemplateConnectionsResponse>(`/api/pricing-templates/${id}/connections`),
};
