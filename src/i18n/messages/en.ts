export interface Messages {
  auth: {
    accountResetCodeSent: string;
    authenticating: string;
    backToLogin: string;
    browserNoPasskeys: string;
    enterResetCode: string;
    forgotPassword: string;
    forgotPasswordDescription: string;
    forgotPasswordError: string;
    forgotPasswordQuestion: string;
    keepSignedInFor: string;
    loginFailed: string;
    newPassword: string;
    orContinueWith: string;
    password: string;
    passwordUpdated: string;
    passkeyAuthenticationFailed: string;
    resetCode: string;
    resetPassword: string;
    resetPasswordError: string;
    resetPasswordTitle: string;
    resetPasswordDescription: string;
    resetting: string;
    sendCode: string;
    sending: string;
    session7Days: string;
    session30Days: string;
    sessionCurrent: string;
    signIn: string;
    signInDescription: string;
    signInWithPasskey: string;
    signingIn: string;
    username: string;
    usernameOrEmail: string;
  };
  common: {
    apiFamily: string;
    loadingApplication: string;
    notApplicable: string;
    vendor: string;
  };
  dashboard: {
    activeModels: string;
    averageRpm: string;
    avgLatency: string;
    errorRate: string;
    estimatedCost: string;
    inspectSpendingBreakdown: string;
    dashboardDescription: string;
    dashboardTitle: string;
    noApiFamilyActivity: string;
    noApiFamilyActivityDescription: string;
    noRecentActivity: string;
    noRecentActivityDescription: string;
    noSpendingData: string;
    noSpendingDataDescription: string;
    openStatistics: string;
    performanceSnapshot: string;
    performanceSnapshotDescription: string;
    apiFamilyMix: string;
    apiFamilyMixDescription: string;
    quickActions: string;
    quickActionsDescription: string;
    recentActivity: string;
    recentActivityDescription: string;
    refreshDashboard: string;
    requests24h: string;
    reviewRequests: string;
    routing24hErrors: string;
    routing24hHealth: string;
    routing24hSuccessRate: string;
    routing24hSuccessfulRequests: string;
    routing24hTotalRequests: string;
    routingActionOpenModelDetail: string;
    routingActiveConnections: string;
    routingChartActionHint: string;
    routingChartHint: string;
    routingEndpoint: string;
    routingEndpointNodeType: string;
    routingLegendDegraded: string;
    routingLegendFailing: string;
    routingLegendHealthy: string;
    routingLegendNoData: string;
    routingLegendNoRecentRequests: string;
    routingLink: string;
    routingLinkAria: (endpoint: string, model: string) => string;
    routingModel: string;
    routingModelNodeType: string;
    routingNoActiveRoutes: string;
    routingNoActiveRoutesDescription: string;
    routingNoData: string;
    routingNoDataDescription: string;
    routingNoRecentTraffic: string;
    routingNoRecentTrafficDescription: string;
    routingNodeType: string;
    routingTitle: string;
    routingDescription: string;
    routingLoadingDescription: string;
    spending30d: string;
    streamingShare: string;
    successfulRequests24h: (count: string) => string;
    activeRoutes: (count: string) => string;
    endpointCount: (count: string) => string;
    modelCount: (count: string) => string;
    totalConfigured: (count: string) => string;
    totalRequests: (count: string) => string;
    successRate: (rate: string) => string;
    p95Latency: string;
    topSpendingModels: string;
    topSpendingModelsDescription: string;
    viewFullReport: string;
  };
  locale: {
    label: string;
    options: Record<"en" | "zh-CN", string>;
  };
  nav: {
    apiKeys: string;
    dashboard: string;
    endpoints: string;
    loadbalanceStrategies: string;
    models: string;
    pricingTemplates: string;
    requestLogs: string;
    settings: string;
    statistics: string;
  };
  loadbalanceStrategyDialog: {
    addTitle: string;
    addStatusCode: string;
    autoRecoveryDescription: string;
    autoRecoveryLabel: string;
    banDurationDescription: string;
    banDurationLabel: string;
    banEscalationDescription: string;
    banEscalationLabel: string;
    banModeDescription: string;
    banModeLabel: string;
    banModeManualOption: string;
    banModeOffOption: string;
    banModeTemporaryOption: string;
    backoffMultiplierDescription: string;
    backoffMultiplierLabel: string;
    baseCooldownDescription: string;
    baseCooldownLabel: string;
    cancel: string;
    description: string;
    editTitle: string;
    explainField: (label: string) => string;
    failoverOption: string;
    fillFirstOption: string;
    roundRobinOption: string;
    failureThresholdDescription: string;
    failureThresholdLabel: string;
    failoverStatusCodesDescription: string;
    failoverStatusCodesLabel: string;
    jitterRatioDescription: string;
    jitterRatioLabel: string;
    maxCooldownStrikesBeforeBanDescription: string;
    maxCooldownStrikesBeforeBanLabel: string;
    maxCooldownDescription: string;
    maxCooldownLabel: string;
    nameLabel: string;
    namePlaceholder: string;
    removeStatusCode: (code: number) => string;
    save: string;
    saving: string;
    singleOption: string;
    singleStrategyHint: string;
    strategyTypeLabel: string;
  };
  loadbalanceStrategyCopy: {
    failoverLabel: string;
    failoverSummary: string;
    fillFirstLabel: string;
    fillFirstSummary: string;
    roundRobinLabel: string;
    roundRobinSummary: string;
    singleLabel: string;
    singleSummary: string;
  };
  pricingTemplateDialog: {
    addTitle: string;
    cacheCreationPriceLabel: string;
    cachedInputPriceLabel: string;
    cancel: string;
    currencyCodeLabel: string;
    description: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    editTitle: string;
    inputPriceLabel: string;
    mapToOutputPrice: string;
    missingSpecialTokenPolicyHint: string;
    missingSpecialTokenPolicyLabel: string;
    nameLabel: string;
    namePlaceholder: string;
    outputPriceLabel: string;
    pricePlaceholder: string;
    reasoningPriceLabel: string;
    save: string;
    saving: string;
    zeroCost: string;
  };
  vendorManagement: {
    actions: string;
    addVendor: string;
    cancel: string;
    createVendor: string;
    delete: string;
    deleteDescription: (name: string) => string;
    deleteInUse: (count: string) => string;
    deleteTitle: string;
    dependencyApiFamily: string;
    dependencyModelId: string;
    dependencyModelType: string;
    dependencyProfile: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    edit: string;
    editVendor: string;
    emptyDescription: string;
    emptyTitle: string;
    currentIconPreviewLabel: string;
    fallbackPreviewDescription: string;
    iconPresetFallbackOption: string;
    iconPresetHelp: string;
    iconPresetLabel: string;
    iconPresetPlaceholder: string;
    keyLabel: string;
    keyPlaceholder: string;
    nameLabel: string;
    namePlaceholder: string;
    noDescription: string;
    saveCreate: string;
    saveEdit: string;
    saving: string;
    sectionDescription: string;
    sectionTitle: string;
    tableDescription: string;
    tableKey: string;
    tableName: string;
    thisActionCannotBeUndone: string;
  };
  settingsPage: {
    auditPrivacy: string;
    backup: string;
    billingCurrency: string;
    globalSettings: string;
    globalSettingsDescription: string;
    globalTab: string;
    profileScopedDescription: (profileLabel: string) => string;
    profileScopedSettings: string;
    profileTab: string;
    retentionDeletion: string;
    sectionsTitle: string;
    settingsDescription: string;
    settingsTitle: string;
    timezone: string;
  };
  profiles: {
    activate: string;
    activating: string;
    activateDescription: string;
    activateTitle: (name: string) => string;
    active: string;
    activeShort: (name: string) => string;
    cancel: string;
    clearSearch: string;
    create: string;
    createDescription: string;
    createNewProfile: string;
    createTitle: string;
    creating: string;
    currentActive: string;
    default: string;
    delete: string;
    deleteDescription: (name: string) => string;
    deleteSelected: string;
    deleteTitle: string;
    deleting: string;
    descriptionOptional: string;
    editDescription: string;
    editSelected: string;
    editTitle: string;
    learnMore: string;
    limitReached: string;
    loadingProfiles: string;
    locked: string;
    manageProfiles: string;
    name: string;
    nameRequired: string;
    newActive: string;
    noDescription: string;
    noMatches: string;
    noProfilesDescription: string;
    noProfilesTitle: string;
    optionalPlaceholder: string;
    profileNamePlaceholder: string;
    profileTriggerTitle: (selected: string, active: string) => string;
    save: string;
    saving: string;
    searchPlaceholder: string;
    selectProfile: string;
    createFailed: string;
    createdProfile: (name: string) => string;
    updateFailed: string;
    updatedProfile: string;
    activateConflict: string;
    activateFailed: string;
    activatedProfile: (name: string) => string;
    deleteFailed: string;
    deletedProfile: (name: string) => string;
    tryDifferentSearchTerm: string;
    typeToConfirm: (value: string) => string;
  };
  modelDetail: {
    active: string;
    addConnection: string;
    addConnectionToStartRouting: string;
    addHeader: string;
    banned: string;
    cancel: string;
    checkAll: string;
    checkedAt: (time: string) => string;
    checkingNow: string;
    connectionActions: string;
    connectionDialogDescription: string;
    connectionDisplayNamePlaceholder: string;
    connectionHealthy: string;
    connectionNameOptional: string;
    connectionUnhealthy: string;
    connections: string;
    connectionsLoadOnDemandDescription: string;
    consecutiveFailures: (count: number) => string;
    createNew: string;
    currentStateBlocked: (
      failureSummary: string,
      cooldown: string,
      failureKind: string,
      blockedUntil: string | null,
    ) => string;
    currentStateCounting: (failureSummary: string, failureKind: string) => string;
    currentStateManualBan: string;
    currentStateProbeEligible: (
      cooldown: string,
      blockedUntil: string | null,
      failureKind: string,
    ) => string;
    currentStateTemporaryBan: (until: string | null) => string;
    customHeaders: string;
    delete: string;
    dragToReorderConnection: (name: string) => string;
    edit: string;
    editable: string;
    editConnection: string;
    endpointApiKey: string;
    endpointApiKeyPlaceholder: string;
    endpointBaseUrl: string;
    endpointBaseUrlPlaceholder: string;
    endpointName: string;
    endpointNamePlaceholder: string;
    endpointSource: string;
    endpointSourceCreateHint: string;
    endpointSourceEditHint: string;
    failoverEvents: (count: string) => string;
    failoverLast: (value: string) => string;
    failoverSignals: string;
    failureCount: (count: number) => string;
    failureKindConnectError: string;
    failureKindTimeout: string;
    failureKindTransientHttp: string;
    failureKindUnknown: string;
    filterConnections: string;
    healthCheck: string;
    healthChecking: string;
    healthHealthy: string;
    healthUnknown: string;
    healthUnhealthy: string;
    headerKey: string;
    headerValue: string;
    includeInLoadBalancing: string;
    inactive: string;
    keyLabel: string;
    leaveBlankForUnlimited: string;
    loadMetrics: string;
    maxInFlightNonStream: string;
    maxInFlightStream: string;
    metricsLoaded: string;
    noConnectionsConfigured: string;
    noConnectionsMatchFilter: string;
    noCustomHeadersConfigured: string;
    noProfileEndpointsFound: string;
    notCheckedYet: string;
    p95Latency24h: string;
    pricingOff: string;
    pricingOn: string;
    pricingTemplate: string;
    pricingTemplateHint: string;
    pricingTemplatePlaceholder: string;
    probeEligible: string;
    qpsLimit: string;
    recoveryBlocked: string;
    recoveryCounting: string;
    resetRecoveryState: string;
    routingPriorityHint: string;
    sampled5xxRate: string;
    saveConnection: string;
    selectEndpoint: string;
    selectedEndpoint: (name: string) => string;
    selectEndpointPlaceholder: string;
    selectExisting: string;
    successRate24h: string;
    successRateSample: (count: string) => string;
    successRateTooltip: string;
    testConnection: string;
    testingConnection: string;
    tryDifferentSearchTerm: string;
    unknownEndpoint: string;
    unpricedNoCostTracking: string;
    useEndpointNameFallback: (name: string | null) => string;
  };
  requestLogs: {
    allColumns: string;
    allConnections: string;
    allEndpoints: string;
    allModels: string;
    allStatuses: string;
    any: string;
    anyLatency: string;
    anyOutcome: string;
    audit: string;
    billableOnly: string;
    cacheCreation: string;
    cacheRead: string;
    compact: string;
    connection: string;
    detailDescription: string;
    endpoint: string;
    fourHundredsOnly: string;
    last24Hours: string;
    latency: string;
    localRefinement: string;
    max: string;
    min: string;
    model: string;
    nonStreaming: string;
    outcome: string;
    overview: string;
    pricedOnly: string;
    reasoning: string;
    refreshRequestLogs: string;
    requestTitle: (id: number | string) => string;
    requestNotFound: string;
    requestNotFoundDescription: (id: string) => string;
    requestLogsDescription: string;
    requestLogsTitle: string;
    noCaptured: (title: string) => string;
    noRequestLogsMatchSlice: string;
    requestBody: string;
    requestHeaders: string;
    search: string;
    searchPlaceholder: string;
    relaxScope: string;
    returnToRequestList: string;
    resultsRange: (start: string, end: string, total: string) => string;
    response: (status: number) => string;
    rowsPerPage: string;
    specialTokens: string;
    status: string;
    stream: string;
    streaming: string;
    technicalInspection: string;
    tokens: string;
    requestDetails: string;
    requestedModel: string;
    proxyOrigin: string;
    resolvedTarget: string;
    time: string;
    totalCost: string;
    totalTokens: string;
    timestamp: string;
    errorDetail: string;
    ingressRequestId: string;
    attemptNumber: string;
    providerCorrelationId: string;
    formattedForReadability: string;
    capturedFailureDetail: string;
    copy: string;
    path: string;
    routingContext: string;
    tokenUsage: string;
    costBreakdown: string;
    input: string;
    output: string;
    total: string;
    priced: string;
    billable: string;
    yes: string;
    no: string;
    whyUnpriced: string;
    baseUrl: string;
    auditCapture: string;
    auditCaptureUnavailable: string;
    auditCaptureDisabledForVendor: string;
    auditLoadFailedTitle: string;
    auditLoadFailed: string;
    noAuditRecords: string;
    timeRange: string;
    tokenRange: string;
    triage: string;
    view: string;
    fiveHundredsOnly: string;
    spend: string;
    viewRequestInLogs: string;
    viewingRequest: (id: string) => string;
    exit: string;
    zeroResults: string;
  };
  shell: {
     activate: string;
     activateProfile: string;
     activating: string;
     activeRuntime: (name: string) => string;
     aligned: string;
     collapseSidebar: string;
     closeSidebar: string;
     expandSidebar: string;
     mismatch: string;
     mismatchWarning: (selected: string, active: string) => string;
     openSidebar: string;
     out: string;
    primaryNavigation: string;
    profile: string;
    profileRuntime: string;
    runtime: string;
    signOut: string;
    viewing: string;
  };
  statistics: {
    addLine: string;
    apiKeyPrefix: string;
    averageRpm: string;
    adjustFiltersOrTimeRange: string;
    aggregation: string;
    all: string;
    allConnections: string;
    allModels: string;
    allRows: string;
    anyError: string;
    availability: string;
    byDay: string;
    byHour: string;
    billableOnlyRequests?: string;
    cacheHitRate: string;
    cachedRows: (count: string) => string;
    clearFilters: string;
    connection: string;
    costOverviewTitle: string;
    costByBucket: string;
    costComponentsBy: (groupBy: string) => string;
    costEfficiencyScatter: string;
    costInsights: string;
    currentRpm: string;
    debug: string;
    errors: string;
    fourxxRate: string;
    fivexxRate: string;
    group: string;
    groupBy: string;
    filters: string;
    filtersApplyToAllSpending: string;
    from: string;
    health: string;
    highestOneMinuteThroughput: string;
    highestSpend: string;
    input: string;
    inputOutputSpecial: string;
    noSpendingDataFound: string;
    loadingThroughputData: string;
    latencyDistribution: string;
    latencyPercentiles: string;
    mostRecentOneMinuteBucket: string;
    mostFrequentErrorSignatures: string;
    noCostRecordsFound: string;
    operationsDescription: string;
    operationsTab: string;
    noDataPointsAvailable: string;
    noErrorSignaturesFound: string;
    noHttpErrorsInSlice: string;
    noRequestsFound: string;
    noThroughputDataAvailable: string;
    output: string;
    peakRpm: string;
    p95Latency: string;
    p99Latency: string;
    percentTotal: string;
    pricedPercent: string;
    provider: string;
    refreshThroughputStatistics: string;
    refreshOperationsStatistics: string;
    refreshSpendingStatistics: string;
    refreshUsageStatistics: string;
    reset: string;
    customRange: string;
    last7Hours: string;
    last24Hours: string;
    last7Days: string;
    last30Days: string;
    allTime: string;
    today: string;
    day: string;
    week: string;
    month: string;
    endpointGroup: string;
    endpointStatisticsTitle: string;
    exportRequestEventsCsv: string;
    exportRequestEventsJson: string;
    exportSnapshotJson: string;
    modelGroup: string;
    lineLimitReached: string;
    linesSelected: (count: string, max: string) => string;
    linesToDisplay: string;
    modelEndpointGroup: string;
    modelStatisticsTitle: string;
    noEndpointStatisticsDescription: string;
    noEndpointStatisticsTitle: string;
    noModelStatisticsDescription: string;
    noModelStatisticsTitle: string;
    requestsInWindow: (count: string) => string;
    noProxyApiKeyUsageDescription: string;
    noProxyApiKeyUsageTitle: string;
    noRequestEventsDescription: string;
    noRequestEventsTitle: string;
    openPricingTemplates: string;
    overviewTitle: string;
    pricingDataMissingDescription: string;
    pricingDataMissingTitle: string;
    proxyApiKey: string;
    proxyApiKeyNotApplicableAuthDisabledTooltip: string;
    proxyApiKeyStatisticsTitle: string;
    removeLine: (label: string) => string;
    previousPage: string;
    nextPage: string;
    requestEventsPage: (page: string, totalPages: string) => string;
    requestEventsPaginationSummary: (start: string, end: string, total: string) => string;
    requestEventsTitle: string;
    showingRequestEvents: (shown: string, total: string) => string;
    requestTrendsTitle: string;
    requestsTab: string;
    requests: string;
    requestsPerMinuteOverTime: string;
    rows: string;
    selectModelLinePlaceholder: string;
    serviceHealthTitle: string;
    slow: string;
    slowestRequests: string;
    rowsPerPage?: string;
    spend: string;
    spendingDescription: string;
    spendingTab: string;
    spendingBreakdown: string;
    tokenTypeBreakdownTitle: string;
    tokenUsageTrendsTitle: string;
    specialTokenCoverageVisibleRows: string;
    cachedCaptured: string;
    cachedPrefix: string;
    connectionId: string;
    costly: string;
    currency: string;
    dollarsPerMillionTokens: string;
    dollarsPerRequest: string;
    modelId: string;
    noDataAvailable: string;
    reasoningCaptured: string;
    anySpecialCaptured: string;
    failedCount: (count: string) => string;
    failedToLoadUsageStatistics: string;
    healthStatusDegraded: string;
    healthStatusDown: string;
    healthStatusIdle: string;
    healthStatusOk: string;
    noTokenUsage: string;
    successful: (count: string) => string;
    successfulCount: (count: string) => string;
    successOnly: string;
    successRate: string;
    specialTokens: string;
    statisticsDescription: string;
    statisticsTitle: string;
    topHttpErrors: string;
    timeWindow: string;
    timeWindowTotal: (seconds: string) => string;
    to: string;
    totalSpend: string;
    totalTokens: string;
    throughputExplanation: string;
    throughputTab: string;
    tokens: string;
    tokenThroughput: string;
    topN: string;
    topEndpointsByCost: string;
    topModelsByCost: string;
    totalRequests: (count: string) => string;
    updated: string;
    unpriced: (count: string) => string;
    unpricedBreakdown: string;
    unknownProxyApiKey: string;
    usageAndCost: string;
    performance: string;
    requestOutcomeOverTime: string;
    viewInRequestLogs: string;
    visibleRequestRows: (count: string) => string;
    investigate: string;
  };
  theme: {
    changeTheme: string;
    dark: string;
    light: string;
    system: string;
  };
}

export const enMessages: Messages = {
  auth: {
    accountResetCodeSent: "If the account matches, a reset code has been sent.",
    authenticating: "Authenticating...",
    backToLogin: "Back to login",
    browserNoPasskeys:
      "Your browser does not support Passkeys. Please use a modern browser or try another login method.",
    enterResetCode: "Enter reset code",
    forgotPassword: "Forgot password?",
    forgotPasswordDescription: "Enter the bound username or email to receive a reset code.",
    forgotPasswordError: "Failed to request password reset",
    forgotPasswordQuestion: "Forgot password?",
    keepSignedInFor: "Keep me signed in for",
    loginFailed: "Login failed",
    newPassword: "New password",
    orContinueWith: "Or continue with",
    password: "Password",
    passwordUpdated: "Password updated. Sign in with your new password.",
    passkeyAuthenticationFailed: "Passkey authentication failed",
    resetCode: "Reset code",
    resetPassword: "Reset password",
    resetPasswordDescription: "Use the emailed OTP and choose a new password.",
    resetPasswordError: "Failed to reset password",
    resetPasswordTitle: "Reset password",
    resetting: "Resetting...",
    sendCode: "Send code",
    sending: "Sending...",
    session7Days: "7 days",
    session30Days: "30 days",
    sessionCurrent: "Current browser session",
    signIn: "Sign in",
    signInDescription: "Sign in to manage Prism settings, profiles, and routing.",
    signInWithPasskey: "Sign in with Passkey",
    signingIn: "Signing in...",
    username: "Username",
    usernameOrEmail: "Username or email",
  },
  common: {
    apiFamily: "API Family",
    loadingApplication: "Loading application...",
    notApplicable: "N/A",
    vendor: "Vendor",
  },
  dashboard: {
    activeModels: "Active Models",
    averageRpm: "Average RPM",
    avgLatency: "Avg Latency",
    dashboardDescription: "System overview and health status",
    dashboardTitle: "Dashboard",
    errorRate: "Error Rate",
    estimatedCost: "Estimated cost",
    inspectSpendingBreakdown: "Inspect Spending Breakdown",
    noRecentActivity: "No recent activity",
    noRecentActivityDescription: "Requests will appear here once processed.",
    noSpendingData: "No spending data",
    noSpendingDataDescription: "Cost data will appear here once requests are priced.",
  noApiFamilyActivity: "No API family activity",
  noApiFamilyActivityDescription: "API family request distribution appears after traffic is processed.",
    openStatistics: "Open Statistics",
    performanceSnapshot: "Performance Snapshot",
    performanceSnapshotDescription: "Current operational profile (24h)",
  apiFamilyMix: "API Family Mix",
  apiFamilyMixDescription: "Request distribution by API family (24h)",
    quickActions: "Quick Actions",
    quickActionsDescription: "Jump to focused spending analysis",
    recentActivity: "Recent Activity",
    recentActivityDescription: "Latest requests processed by the gateway",
    refreshDashboard: "Refresh dashboard",
    requests24h: "24h Requests",
    reviewRequests: "Review Requests",
    routing24hErrors: "24h errors",
    routing24hHealth: "24h health",
    routing24hSuccessRate: "24h success rate",
    routing24hSuccessfulRequests: "24h successful requests",
    routing24hTotalRequests: "24h total requests",
    routingActionOpenModelDetail: "Open model detail",
    routingActiveConnections: "Active connections",
    routingChartActionHint: "Click model nodes to open details",
    routingChartHint: "Link width reflects active connection count. Color reflects 24h route success rate.",
    routingEndpoint: "Endpoint",
    routingEndpointNodeType: "Endpoint",
    routingLegendDegraded: "Degraded",
    routingLegendFailing: "Failing",
    routingLegendHealthy: "Healthy",
    routingLegendNoData: "No data",
    routingLegendNoRecentRequests: "No recent requests",
    routingLink: "Routing link",
    routingLinkAria: (endpoint, model) => `Route from ${endpoint} to ${model}`,
    routingModel: "Model",
    routingModelNodeType: "Model",
    routingNoActiveRoutes: "No active routes",
    routingNoActiveRoutesDescription:
      "Activate at least one model connection to map live routing paths across endpoints and models.",
    routingNoData: "No routing data",
    routingNoDataDescription: "No routing diagram data is available for this profile.",
    routingNoRecentTraffic: "No routed traffic in the last 24h",
    routingNoRecentTrafficDescription:
      "Active routes are configured, but no successful request traffic was recorded for the current profile in the last 24 hours.",
    routingNodeType: "Node type",
    routingTitle: "Routing Health Map",
    routingDescription:
      "Trace active endpoint-to-model paths in one view. Link width reflects active route count, while color reflects 24-hour route health.",
    routingLoadingDescription: "Loading live routing volume and 24-hour health data",
    spending30d: "30d Spending",
    streamingShare: "Streaming Share",
    successfulRequests24h: (count) => `${count} successful requests in 24h`,
    activeRoutes: (count) => `${count} active route${count === "1" ? "" : "s"}`,
    endpointCount: (count) => `${count} endpoint${count === "1" ? "" : "s"}`,
    modelCount: (count) => `${count} model${count === "1" ? "" : "s"}`,
    totalConfigured: (count) => `of ${count} total configured`,
    totalRequests: (count) => `${count} total requests`,
    successRate: (rate) => `${rate}% success rate`,
    p95Latency: "P95 Latency",
    topSpendingModels: "Top Spending Models",
    topSpendingModelsDescription: "Highest cost models (last 30 days)",
    viewFullReport: "View Full Report",
  },
  locale: {
    label: "Language",
    options: {
      en: "English",
      "zh-CN": "简体中文",
    },
  },
  nav: {
    apiKeys: "API Keys",
    dashboard: "Dashboard",
    endpoints: "Endpoints",
    loadbalanceStrategies: "Loadbalance Strategies",
    models: "Models",
    pricingTemplates: "Pricing Templates",
    requestLogs: "Request Logs",
    settings: "Settings",
    statistics: "Statistics",
  },
  loadbalanceStrategyDialog: {
    addTitle: "Add Loadbalance Strategy",
    addStatusCode: "Add Status Code",
    autoRecoveryDescription:
      "Allow failed endpoints in this strategy to recover automatically after backend-managed cooldown windows.",
    autoRecoveryLabel: "Auto-Recovery",
    banDurationDescription:
      "How long a temporary ban lasts before the connection becomes probe-eligible again.",
    banDurationLabel: "Ban Duration (seconds)",
    banEscalationDescription:
      "Escalate repeated max-cooldown strikes into a temporary or manual-dismiss ban without replacing the existing cooldown policy.",
    banEscalationLabel: "Ban escalation",
    banModeDescription:
      "Choose whether repeated max-cooldown strikes stay off, expire automatically, or wait for a manual dismiss.",
    banModeLabel: "Ban Mode",
    banModeManualOption: "Manual dismiss",
    banModeOffOption: "Off",
    banModeTemporaryOption: "Temporary",
    backoffMultiplierDescription:
      "Multiplier applied to the cooldown after each failure beyond the threshold.",
    backoffMultiplierLabel: "Backoff Multiplier",
    baseCooldownDescription:
      "Starting cooldown applied after transient failures once the threshold is reached.",
    baseCooldownLabel: "Base Cooldown (seconds)",
    cancel: "Cancel",
    description: "Configure reusable routing behavior for native models in this profile.",
    editTitle: "Edit Loadbalance Strategy",
    explainField: (label) => `Explain ${label}`,
    failoverOption: "Failover",
    fillFirstOption: "Fill-first",
    roundRobinOption: "Round-robin",
    failureThresholdDescription:
      "Number of consecutive failures required before the cooldown window opens.",
    failureThresholdLabel: "Failure Threshold",
    failoverStatusCodesDescription:
      "HTTP status codes that should trigger failover for non-single strategies.",
    failoverStatusCodesLabel: "Failover Status Codes",
    jitterRatioDescription:
      "Random spread applied to the cooldown so retries do not all happen at the same instant.",
    jitterRatioLabel: "Jitter Ratio",
    maxCooldownStrikesBeforeBanDescription:
      "Number of max-cooldown strike events required before this connection is marked as banned.",
    maxCooldownStrikesBeforeBanLabel: "Max-cooldown Strikes Before Ban",
    maxCooldownDescription:
      "Upper limit for the computed cooldown, even after repeated failures.",
    maxCooldownLabel: "Max Cooldown (seconds)",
    nameLabel: "Name",
    namePlaceholder: "e.g. failover-primary",
    removeStatusCode: (code) => `Remove status code ${code}`,
    save: "Save Strategy",
    saving: "Saving...",
    singleOption: "Single",
    singleStrategyHint:
      "Single strategies always route through one active connection and do not expose recovery.",
    strategyTypeLabel: "Strategy Type",
  },
  loadbalanceStrategyCopy: {
    failoverLabel: "Failover",
    failoverSummary: "Health-aware failover",
    fillFirstLabel: "Fill-first",
    fillFirstSummary: "Priority spillover",
    roundRobinLabel: "Round-robin",
    roundRobinSummary: "Rotating active connections",
    singleLabel: "Single",
    singleSummary: "Single active connection",
  },
  pricingTemplateDialog: {
    addTitle: "Add Pricing Template",
    cacheCreationPriceLabel: "Cache Creation Price (Optional)",
    cachedInputPriceLabel: "Cached Input Price (Optional)",
    cancel: "Cancel",
    currencyCodeLabel: "Currency Code",
    description: "Configure pricing rates per 1M tokens.",
    descriptionLabel: "Description (Optional)",
    descriptionPlaceholder: "Optional details about this template",
    editTitle: "Edit Pricing Template",
    inputPriceLabel: "Input Price (per 1M tokens)",
    mapToOutputPrice: "Map to Output Price",
    missingSpecialTokenPolicyHint:
      "How to price special tokens (like reasoning) if their specific price is not set.",
    missingSpecialTokenPolicyLabel: "Missing Special Token Policy",
    nameLabel: "Name",
    namePlaceholder: "e.g., GPT-4o Standard",
    outputPriceLabel: "Output Price (per 1M tokens)",
    pricePlaceholder: "0.00",
    reasoningPriceLabel: "Reasoning Price (Optional)",
    save: "Save Template",
    saving: "Saving...",
    zeroCost: "Zero Cost",
  },
  vendorManagement: {
    actions: "Actions",
    addVendor: "Add Vendor",
    cancel: "Cancel",
    createVendor: "Add Vendor",
    delete: "Delete",
    deleteDescription: (name) => `Are you sure you want to delete the vendor "${name}"?`,
    deleteInUse: (count) => `This vendor is referenced by ${count} model${count === "1" ? "" : "s"} and cannot be deleted yet.`,
    deleteTitle: "Delete Vendor",
    dependencyApiFamily: "API Family",
    dependencyModelId: "Model ID",
    dependencyModelType: "Model Type",
    dependencyProfile: "Profile",
    descriptionLabel: "Description (Optional)",
    descriptionPlaceholder: "Optional details about this vendor",
    edit: "Edit",
    editVendor: "Edit Vendor",
    emptyDescription: "Create a shared vendor entry here to make it available across profiles.",
    emptyTitle: "No vendors configured",
    currentIconPreviewLabel: "Current icon preview",
    fallbackPreviewDescription: "If no preset fits, Prism falls back to a letter monogram.",
    iconPresetFallbackOption: "No preset (use fallback)",
    iconPresetHelp: "Choose a bundled vendor mark when one fits this vendor.",
    iconPresetLabel: "Icon preset",
    iconPresetPlaceholder: "Select an icon preset",
    keyLabel: "Vendor Key",
    keyPlaceholder: "e.g. openai",
    nameLabel: "Vendor Name",
    namePlaceholder: "e.g. OpenAI",
    noDescription: "No description",
    saveCreate: "Create Vendor",
    saveEdit: "Save Vendor",
    saving: "Saving...",
    sectionDescription: "Manage the shared vendor catalog used by models and audit defaults across all profiles.",
    sectionTitle: "Vendor Management",
    tableDescription: "Description",
    tableKey: "Key",
    tableName: "Name",
    thisActionCannotBeUndone: "This action cannot be undone.",
  },
  settingsPage: {
    auditPrivacy: "Audit & Privacy",
    backup: "Backup",
    billingCurrency: "Billing & Currency",
    globalSettings: "Global settings",
    globalSettingsDescription: "Changes here apply to all profiles and the entire Prism instance.",
    globalTab: "Global",
    profileScopedDescription: (profileLabel) => `Changes here affect ${profileLabel} and its runtime traffic.`,
    profileScopedSettings: "Profile-scoped settings",
    profileTab: "Profile",
    retentionDeletion: "Retention & Deletion",
    sectionsTitle: "Settings Sections",
    settingsDescription: "Manage instance-wide authentication and profile-scoped configuration",
    settingsTitle: "Settings",
    timezone: "Timezone",
  },
  profiles: {
    activate: "Activate",
    activating: "Activating...",
    activateDescription:
      "This will switch the active runtime profile. Existing traffic will route using the newly active profile.",
    activateTitle: (name) => `Activate "${name}" for runtime traffic?`,
    active: "Active",
    activeShort: (name) => `Active: ${name}`,
    cancel: "Cancel",
    clearSearch: "Clear search",
    create: "Create",
    createDescription:
      "Create a new management scope profile. Runtime traffic is unaffected until activation.",
    createNewProfile: "Create new profile",
    createTitle: "Create Profile",
    creating: "Creating...",
    currentActive: "Current active:",
    default: "Default",
    delete: "Delete",
    deleteDescription: (name) => `Delete selected profile ${name}. This action is irreversible.`,
    deleteSelected: "Delete selected",
    deleteTitle: "Delete Profile",
    deleting: "Deleting...",
    descriptionOptional: "Description (Optional)",
    editDescription: "Update selected profile metadata. This does not activate runtime traffic.",
    editSelected: "Edit selected",
    editTitle: "Edit Profile",
    learnMore: "Learn more",
    limitReached: "You've reached the limit (10). Delete an inactive profile to create a new one.",
    loadingProfiles: "Loading profiles...",
    locked: "Locked",
    manageProfiles: "Manage profiles",
    name: "Name",
    nameRequired: "Profile name is required",
    newActive: "New active:",
    noDescription: "No description",
    noMatches: "No matches",
    noProfilesDescription: "Create a profile to start routing traffic or running tests.",
    noProfilesTitle: "No profiles yet",
    optionalPlaceholder: "Optional",
    profileNamePlaceholder: "Profile name",
    profileTriggerTitle: (selected, active) => `Selected profile: ${selected}. Active runtime: ${active}.`,
    save: "Save",
    saving: "Saving...",
    searchPlaceholder: "Search profiles...",
    selectProfile: "Select profile",
    createFailed: "Failed to create profile",
    createdProfile: (name) => `Created profile ${name}`,
    updateFailed: "Failed to update profile",
    updatedProfile: "Profile updated",
    activateConflict:
      "Activation conflict detected. Active profile changed elsewhere, profile state was refreshed.",
    activateFailed: "Failed to activate profile",
    activatedProfile: (name) => `Activated ${name} for runtime traffic`,
    deleteFailed: "Failed to delete profile",
    deletedProfile: (name) => `Deleted profile ${name}`,
    tryDifferentSearchTerm: "Try a different search term.",
    typeToConfirm: (value) => `Type ${value} to confirm`,
  },
  modelDetail: {
    active: "Active",
    addConnection: "Add Connection",
    addConnectionToStartRouting: "Add a connection to start routing requests",
    addHeader: "Add Header",
    banned: "Banned",
    cancel: "Cancel",
    checkAll: "Check All",
    checkedAt: (time) => `Checked ${time}`,
    checkingNow: "Checking now...",
    connectionActions: "Connection actions",
    connectionDialogDescription:
      "Configure endpoint source and optional pricing template for this connection. Routing priority is managed from the connection list by dragging cards.",
    connectionDisplayNamePlaceholder: "Connection display name",
    connectionHealthy: "Connection Healthy",
    connectionNameOptional: "Name (Optional)",
    connectionUnhealthy: "Connection Unhealthy",
    connections: "Connections",
    connectionsLoadOnDemandDescription:
      "Connection metrics and health checks load on demand to avoid large page-open bursts.",
    consecutiveFailures: (count) => `${count} consecutive failure${count === 1 ? "" : "s"}`,
    createNew: "Create New",
    currentStateBlocked: (failureSummary, cooldown, failureKind, blockedUntil) =>
      `${failureSummary} triggered a ${cooldown} cooldown after ${failureKind}. Routing stays paused until ${blockedUntil ?? "the cooldown expires"}.`,
    currentStateCounting: (failureSummary, failureKind) =>
      `Tracking ${failureSummary} after ${failureKind}. No cooldown is currently open, but failover recovery is still counting these signals.`,
    currentStateManualBan: "This connection is banned until the operator dismisses it.",
    currentStateProbeEligible: (cooldown, blockedUntil, failureKind) =>
      `The last ${cooldown} cooldown expired${blockedUntil ? ` at ${blockedUntil}` : ""}. This connection is now eligible for the next routed probe after ${failureKind}.`,
    currentStateTemporaryBan: (until) =>
      `This connection is banned until ${until ?? "the temporary ban expires"}.`,
    customHeaders: "Custom Headers",
    delete: "Delete",
    dragToReorderConnection: (name) => `Drag to reorder connection ${name}`,
    edit: "Edit",
    editable: "Editable",
    editConnection: "Edit Connection",
    endpointApiKey: "API Key",
    endpointApiKeyPlaceholder: "sk-...",
    endpointBaseUrl: "Base URL",
    endpointBaseUrlPlaceholder: "https://api.openai.com",
    endpointName: "Name",
    endpointNamePlaceholder: "e.g. OpenAI Primary",
    endpointSource: "Endpoint Source",
    endpointSourceCreateHint: "Choose an existing endpoint or create one inline for this connection.",
    endpointSourceEditHint: "Switch this connection to another endpoint or create a new one.",
    failoverEvents: (count) => `Events: ${count}`,
    failoverLast: (value) => `Last: ${value}`,
    failoverSignals: "Failover-like signals (derived from 5xx)",
    failureCount: (count) => `${count} failure${count === 1 ? "" : "s"}`,
    failureKindConnectError: "a connection error",
    failureKindTimeout: "a timeout",
    failureKindTransientHttp: "a transient HTTP failure",
    failureKindUnknown: "an unknown failure",
    filterConnections: "Filter connections...",
    healthCheck: "Health Check",
    healthChecking: "Checking",
    healthHealthy: "Healthy",
    healthUnknown: "Unknown",
    healthUnhealthy: "Unhealthy",
    headerKey: "Header Key",
    headerValue: "Value",
    includeInLoadBalancing: "Include in load balancing",
    inactive: "Inactive",
    keyLabel: "Key",
    leaveBlankForUnlimited: "Leave blank for unlimited.",
    loadMetrics: "Load 24h Metrics",
    maxInFlightNonStream: "Max In-Flight (Non-Stream)",
    maxInFlightStream: "Max In-Flight (Stream)",
    metricsLoaded: "24h Metrics Loaded",
    noConnectionsConfigured: "No connections configured",
    noConnectionsMatchFilter: "No connections match your filter",
    noCustomHeadersConfigured: "No custom headers configured.",
    noProfileEndpointsFound: "No profile endpoints found.",
    notCheckedYet: "Not checked yet",
    p95Latency24h: "P95 latency (24h)",
    pricingOff: "Pricing Off",
    pricingOn: "Pricing On",
    pricingTemplate: "Pricing Template",
    pricingTemplateHint: "Assign a pricing template to track costs for this connection.",
    pricingTemplatePlaceholder: "Select a pricing template...",
    probeEligible: "Probe Eligible",
    qpsLimit: "QPS Limit",
    recoveryBlocked: "Recovery Blocked",
    recoveryCounting: "Recovery Counting",
    resetRecoveryState: "Reset Recovery State",
    routingPriorityHint:
      "New connections are appended as fallbacks. Drag and drop cards in the Model Detail list to adjust routing priority.",
    sampled5xxRate: "5xx rate (sampled)",
    saveConnection: "Save Connection",
    selectEndpoint: "Select Endpoint",
    selectedEndpoint: (name) => `Selected: ${name}`,
    selectEndpointPlaceholder: "Select an endpoint...",
    selectExisting: "Select Existing",
    successRate24h: "Success rate (24h)",
    successRateSample: (count) => `n=${count}`,
    successRateTooltip:
      "Success rate = successful requests / total requests for this connection in the last 24 hours. n = total requests counted in that 24h window.",
    testConnection: "Test Connection",
    testingConnection: "Testing...",
    tryDifferentSearchTerm: "Try a different search term",
    unknownEndpoint: "Unknown endpoint",
    unpricedNoCostTracking: "Unpriced (No cost tracking)",
    useEndpointNameFallback: (name) =>
      name ? `Leave blank to use endpoint name: ${name}.` : "Leave blank to use endpoint name.",
  },
  requestLogs: {
    allColumns: "All columns",
    allConnections: "All connections",
    allEndpoints: "All endpoints",
    allModels: "All models",
    allStatuses: "All statuses",
    any: "Any",
    anyLatency: "Any latency",
    anyOutcome: "Any outcome",
    audit: "Audit",
    billableOnly: "Billable only",
    cacheCreation: "Cache creation",
    cacheRead: "Cache read",
    compact: "Compact",
    connection: "Connection",
    detailDescription: "Review request metadata, routing, tokens, costs, and captured upstream payloads.",
    endpoint: "Endpoint",
    fiveHundredsOnly: "5xx only",
    fourHundredsOnly: "4xx only",
    last24Hours: "Last 24 hours",
    latency: "Latency",
    localRefinement: "Local refinement",
    max: "Max",
    min: "Min",
    model: "Model",
    nonStreaming: "Non-streaming",
    outcome: "Outcome",
    overview: "Overview",
    pricedOnly: "Priced only",
    reasoning: "Reasoning",
    refreshRequestLogs: "Refresh request logs",
    requestTitle: (id) => `Request #${id}`,
    requestNotFound: "Request Not Found",
    requestNotFoundDescription: (id) => `Request #${id} could not be found. It may have been deleted or you might not have access to it.`,
    requestLogsDescription: "Browse and investigate proxied request history",
    requestLogsTitle: "Request Logs",
    noCaptured: (title) => `No ${title.toLowerCase()} captured.`,
    noRequestLogsMatchSlice: "No request logs match this slice",
    requestBody: "Request",
    requestHeaders: "Request headers",
    search: "Search",
    searchPlaceholder: "model, vendor, path, or error",
    relaxScope: "Relax the scope or clear local refinements to widen the investigation surface.",
    returnToRequestList: "Return to request list",
    response: (status) => `Response (${status})`,
    resultsRange: (start, end, total) => `${start}-${end} of ${total}`,
    rowsPerPage: "rows per page",
    specialTokens: "Special tokens",
    status: "Status",
    stream: "Stream",
    streaming: "Streaming",
    technicalInspection: "Technical inspection",
    requestDetails: "Request details",
    requestedModel: "Requested model",
    proxyOrigin: "Proxy origin",
    resolvedTarget: "Resolved target",
    time: "Time",
    totalCost: "Total cost",
    totalTokens: "Total tokens",
    timestamp: "Timestamp",
    errorDetail: "Error detail",
    ingressRequestId: "Ingress request ID",
    attemptNumber: "Attempt number",
    providerCorrelationId: "Provider correlation ID",
    formattedForReadability: "Captured upstream failure detail, formatted for readability.",
    capturedFailureDetail: "Captured upstream failure detail.",
    copy: "Copy",
    path: "Path",
    routingContext: "Routing context",
    tokenUsage: "Token usage",
    costBreakdown: "Cost breakdown",
    input: "Input",
    output: "Output",
    total: "Total",
    priced: "Priced",
    billable: "Billable",
    yes: "Yes",
    no: "No",
    whyUnpriced: "Why unpriced",
    baseUrl: "Base URL",
    auditCapture: "Audit capture",
    auditCaptureUnavailable: "Audit capture unavailable",
    auditCaptureDisabledForVendor: "Audit logging may be disabled for this vendor.",
    auditLoadFailedTitle: "Audit detail load failed",
    auditLoadFailed: "Failed to load audit details after multiple attempts.",
    noAuditRecords: "No audit records found for this request.",
    timeRange: "Time range",
    tokenRange: "Token range",
    tokens: "Tokens",
    triage: "Triage",
    view: "View",
    spend: "Cost",
    viewRequestInLogs: "View in Request Logs",
    viewingRequest: (id) => `Viewing request #${id}`,
    exit: "Exit",
    zeroResults: "0 results",
  },
  shell: {
    activate: "Activate",
    activateProfile: "Activate profile",
    activating: "Activating...",
    activeRuntime: (name) => `Active runtime: ${name}`,
    aligned: "Aligned",
    collapseSidebar: "Collapse sidebar",
    closeSidebar: "Close sidebar",
    expandSidebar: "Expand sidebar",
    mismatch: "Mismatch",
    mismatchWarning: (selected, active) =>
      `You're viewing ${selected}, but runtime traffic is served by ${active}.`,
    openSidebar: "Open sidebar",
    out: "Out",
    primaryNavigation: "Primary navigation",
    profile: "Profile:",
    profileRuntime: "Profile runtime",
    runtime: "Runtime",
    signOut: "Sign out",
    viewing: "Viewing",
  },
  statistics: {
    addLine: "Add Line",
    apiKeyPrefix: "Key Prefix",
    averageRpm: "Average RPM",
    adjustFiltersOrTimeRange: "Try adjusting your filters or time range.",
    aggregation: "Aggregation",
    all: "All",
    allConnections: "All Connections",
    allModels: "All Models",
    allRows: "All rows",
    anyError: "Any error",
    availability: "Availability",
    byDay: "By Day",
    byHour: "By Hour",
    cacheHitRate: "Cache Hit Rate",
    cachedRows: (count) => `${count} cached rows`,
    clearFilters: "Clear Filters",
    connection: "Connection",
    costOverviewTitle: "Cost Overview",
    costByBucket: "Cost by Bucket",
    costComponentsBy: (groupBy) => `Cost Components by ${groupBy}`,
    costEfficiencyScatter: "Cost Efficiency Scatter",
    costInsights: "Cost Insights",
    currentRpm: "Current RPM",
    debug: "Debug",
    errors: "Errors",
    fourxxRate: "4xx Rate",
    fivexxRate: "5xx Rate",
    filters: "Filters",
    filtersApplyToAllSpending: "Filters apply to all spending metrics and breakdowns below.",
    from: "From",
    group: "Group",
    groupBy: "Group By",
    health: "Health",
    highestOneMinuteThroughput: "Highest 1-minute throughput",
    highestSpend: "Highest Spend",
    input: "Input",
    inputOutputSpecial: "Input + output + special tokens",
    noSpendingDataFound: "No spending data found",
    loadingThroughputData: "Loading throughput data...",
    latencyDistribution: "Latency Distribution",
    latencyPercentiles: "Latency Percentiles",
    mostRecentOneMinuteBucket: "Most recent 1-minute bucket",
    mostFrequentErrorSignatures: "Most frequent error signatures for this filter set.",
    noCostRecordsFound: "No cost records found.",
    operationsDescription: "Operational metrics and spending analytics",
    operationsTab: "Operations",
    noDataPointsAvailable: "No data points available",
    noErrorSignaturesFound: "No error signatures found.",
    noHttpErrorsInSlice: "No HTTP errors in this slice.",
    noRequestsFound: "No requests found.",
    noThroughputDataAvailable: "No throughput data available",
    output: "Output",
    peakRpm: "Peak RPM",
    p95Latency: "P95 Latency",
    p99Latency: "P99 Latency",
    percentTotal: "% Total",
    pricedPercent: "Priced %",
    provider: "Provider",
    refreshThroughputStatistics: "Refresh throughput statistics",
    refreshOperationsStatistics: "Refresh operations statistics",
    refreshSpendingStatistics: "Refresh spending statistics",
    refreshUsageStatistics: "Refresh usage statistics",
    reset: "Reset",
    customRange: "Custom Range",
    last7Hours: "Last 7 Hours",
    last24Hours: "Last 24 Hours",
    last7Days: "Last 7 Days",
    last30Days: "Last 30 Days",
    allTime: "All Time",
    today: "Today",
    day: "Day",
    week: "Week",
    month: "Month",
    endpointGroup: "Endpoint",
    endpointStatisticsTitle: "Endpoint Statistics",
    exportRequestEventsCsv: "Export request events CSV",
    exportRequestEventsJson: "Export request events JSON",
    exportSnapshotJson: "Export snapshot JSON",
    lineLimitReached: "You can compare up to 9 model lines at once.",
    linesSelected: (count, max) => `${count} / ${max}`,
    linesToDisplay: "Lines to Display",
    modelGroup: "Model",
    modelStatisticsTitle: "Model Statistics",
    modelEndpointGroup: "Model + Endpoint",
    noEndpointStatisticsDescription: "Endpoint rollups will appear here after traffic is processed.",
    noEndpointStatisticsTitle: "No endpoint statistics in this time range",
    noModelStatisticsDescription: "Model rollups will appear here after traffic is processed.",
    noModelStatisticsTitle: "No model statistics in this time range",
    noProxyApiKeyUsageDescription: "Runtime-auth usage will appear here after proxy API keys are used.",
    noProxyApiKeyUsageTitle: "No proxy API key usage in this time range",
    noRequestEventsDescription: "Final request events will appear here after the gateway processes traffic.",
    noRequestEventsTitle: "No request events in this time range",
    openPricingTemplates: "Open Pricing Templates",
    overviewTitle: "Overview",
    pricingDataMissingDescription: "Attach pricing templates to connections to unlock cost coverage on the statistics page.",
    pricingDataMissingTitle: "Pricing data is missing for this time range",
    proxyApiKey: "Proxy API Key",
    proxyApiKeyNotApplicableAuthDisabledTooltip:
      "Not applicable because proxy authentication is disabled in Settings.",
    proxyApiKeyStatisticsTitle: "Proxy API Key Statistics",
    removeLine: (label) => `Remove line ${label}`,
    previousPage: "Previous Page",
    nextPage: "Next Page",
    requestEventsPage: (page, totalPages) => `Page ${page} of ${totalPages}`,
    requestEventsPaginationSummary: (start, end, total) => `Rows ${start}-${end} of ${total}`,
    requestEventsTitle: "Request Events",
    showingRequestEvents: (shown, total) => `Showing ${shown} of ${total} request events`,
    requestTrendsTitle: "Request Trends",
    requestsInWindow: (count) => `${count} reqs in window`,
    requestsTab: "Requests",
    requests: "Requests",
    requestsPerMinuteOverTime: "Requests Per Minute (RPM) Over Time",
    rows: "Rows",
    selectModelLinePlaceholder: "Choose a model line",
    serviceHealthTitle: "Service Health",
    slow: "Slow",
    slowestRequests: "Slowest requests by latency in current filtered slice.",
    spend: "Spend",
    spendingDescription: "Operational metrics and spending analytics",
    spendingTab: "Spending",
    spendingBreakdown: "Spending Breakdown",
    specialTokenCoverageVisibleRows: "Special Token Coverage (visible rows)",
    cachedCaptured: "Cached captured",
    cachedPrefix: "Cached",
    connectionId: "Connection ID",
    costly: "Costly",
    currency: "Currency",
    dollarsPerMillionTokens: "$ / 1M tokens",
    dollarsPerRequest: "$ / Request",
    modelId: "Model ID",
    noDataAvailable: "No data available",
    reasoningCaptured: "Reasoning captured",
    anySpecialCaptured: "Any special captured",
    failedCount: (count) => `${count} failed`,
    failedToLoadUsageStatistics: "Failed to load usage statistics",
    healthStatusDegraded: "Degraded",
    healthStatusDown: "Down",
    healthStatusIdle: "Idle",
    healthStatusOk: "OK",
    noTokenUsage: "No token usage",
    successful: (count) => `${count} successful`,
    successfulCount: (count) => `${count} successful`,
    successOnly: "Successful only",
    successRate: "Success Rate",
    specialTokens: "Special Tokens",
    statisticsDescription: "One request-based usage snapshot across requests, tokens, cost, endpoints, models, and proxy API keys.",
    statisticsTitle: "Usage Statistics",
    tokenTypeBreakdownTitle: "Token Type Breakdown",
    tokenUsageTrendsTitle: "Token Usage Trends",
    topHttpErrors: "Top HTTP Errors",
    timeWindow: "Time Window",
    timeWindowTotal: (seconds) => `${seconds}s total`,
    to: "To",
    totalSpend: "Total Spend",
    totalTokens: "Total Tokens",
    throughputExplanation:
      "Each data point represents a 1-minute time bucket. RPM matches the requests recorded in that minute, and Average RPM normalizes the selected window to requests per minute.",
    throughputTab: "Throughput",
    tokens: "Tokens",
    tokenThroughput: "Token Throughput",
    topN: "Top N",
    topEndpointsByCost: "Top Endpoints by Cost",
    topModelsByCost: "Top Models by Cost",
    totalRequests: (count) => `${count} total requests`,
    updated: "Updated",
    unpriced: (count) => `${count} unpriced`,
    unpricedBreakdown: "Unpriced Breakdown",
    unknownProxyApiKey: "Unknown proxy API key",
    usageAndCost: "Usage & Cost",
    performance: "Performance",
    requestOutcomeOverTime: "Request Outcome Over Time",
    viewInRequestLogs: "View in Request Logs",
    visibleRequestRows: (count) => `Visible request rows: ${count}`,
    investigate: "Investigate",
  },
  theme: {
    changeTheme: "Change theme",
    dark: "Dark",
    light: "Light",
    system: "System",
  },
};
