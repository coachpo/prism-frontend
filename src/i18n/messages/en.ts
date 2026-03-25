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
    loadingApplication: string;
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
    noProviderActivity: string;
    noProviderActivityDescription: string;
    noRecentActivity: string;
    noRecentActivityDescription: string;
    noSpendingData: string;
    noSpendingDataDescription: string;
    openStatistics: string;
    performanceSnapshot: string;
    performanceSnapshotDescription: string;
    providerMix: string;
    providerMixDescription: string;
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
  requestLogs: {
    allColumns: string;
    allConnections: string;
    allEndpoints: string;
    allModels: string;
    allProviders: string;
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
    provider: string;
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
    time: string;
    totalCost: string;
    totalTokens: string;
    timestamp: string;
    errorDetail: string;
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
    averageRpm: string;
    adjustFiltersOrTimeRange: string;
    aggregation: string;
    all: string;
    allConnections: string;
    allModels: string;
    allRows: string;
    anyError: string;
    billableOnlyRequests?: string;
    cacheHitRate: string;
    cachedRows: (count: string) => string;
    clearFilters: string;
    connection: string;
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
    reset: string;
    customRange: string;
    last7Days: string;
    last30Days: string;
    allTime: string;
    today: string;
    day: string;
    week: string;
    month: string;
    endpointGroup: string;
    modelGroup: string;
    providerGroup: string;
    modelEndpointGroup: string;
    requestsInWindow: (count: string) => string;
    requestsTab: string;
    requests: string;
    requestsPerMinuteOverTime: string;
    rows: string;
    slow: string;
    slowestRequests: string;
    rowsPerPage?: string;
    spend: string;
    spendingDescription: string;
    spendingTab: string;
    spendingBreakdown: string;
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
    noTokenUsage: string;
    successful: (count: string) => string;
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
    loadingApplication: "Loading application...",
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
    noProviderActivity: "No provider activity",
    noProviderActivityDescription: "Provider request distribution appears after traffic is processed.",
    openStatistics: "Open Statistics",
    performanceSnapshot: "Performance Snapshot",
    performanceSnapshotDescription: "Current operational profile (24h)",
    providerMix: "Provider Mix",
    providerMixDescription: "Request distribution by provider (24h)",
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
  requestLogs: {
    allColumns: "All columns",
    allConnections: "All connections",
    allEndpoints: "All endpoints",
    allModels: "All models",
    allProviders: "All providers",
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
    provider: "Provider",
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
    searchPlaceholder: "model, provider, path, or error",
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
    time: "Time",
    totalCost: "Total cost",
    totalTokens: "Total tokens",
    timestamp: "Timestamp",
    errorDetail: "Error detail",
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
    averageRpm: "Average RPM",
    adjustFiltersOrTimeRange: "Try adjusting your filters or time range.",
    aggregation: "Aggregation",
    all: "All",
    allConnections: "All Connections",
    allModels: "All Models",
    allRows: "All rows",
    anyError: "Any error",
    cacheHitRate: "Cache Hit Rate",
    cachedRows: (count) => `${count} cached rows`,
    clearFilters: "Clear Filters",
    connection: "Connection",
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
    reset: "Reset",
    customRange: "Custom Range",
    last7Days: "Last 7 Days",
    last30Days: "Last 30 Days",
    allTime: "All Time",
    today: "Today",
    day: "Day",
    week: "Week",
    month: "Month",
    endpointGroup: "Endpoint",
    modelGroup: "Model",
    providerGroup: "Provider",
    modelEndpointGroup: "Model + Endpoint",
    requestsInWindow: (count) => `${count} reqs in window`,
    requestsTab: "Requests",
    requests: "Requests",
    requestsPerMinuteOverTime: "Requests Per Minute (RPM) Over Time",
    rows: "Rows",
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
    noTokenUsage: "No token usage",
    successful: (count) => `${count} successful`,
    successOnly: "Successful only",
    successRate: "Success Rate",
    specialTokens: "Special Tokens",
    statisticsDescription: "Operational metrics and spending analytics",
    statisticsTitle: "Statistics",
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
