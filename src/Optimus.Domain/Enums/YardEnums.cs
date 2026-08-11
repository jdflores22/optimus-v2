namespace Optimus.Domain.Enums;

public enum TerminalIdentity
{
    PortTerminal = 0,
    ContainerYard = 1
}

public enum TerminalKind
{
    /** Container yard marker — used only when identity is ContainerYard. */
    Cy = 0,
    /** Port terminal operator — used only when identity is PortTerminal. */
    Ati = 1,
    /** Port terminal operator — used only when identity is PortTerminal. */
    Ictsi = 2
}

public enum SlotStatus
{
    Available = 0,
    Full = 1,
    Blocked = 2
}

public enum ContainerStatus
{
    Pending = 0,
    AvailableForReturn = 1,
    PreForecastApproved = 2,
    InTransit = 3,
    AtTerminal = 4,
    Returned = 5,
    Maintenance = 6,
    Alert = 7
}

public enum AllocationStatus
{
    None = 0,
    PreForecast = 1,
    Allocated = 2,
    Released = 3
}

public enum PreForecastRequestStatus
{
    Pending = 0,
    Verified = 1,
    Rejected = 2,
    Cancelled = 3,
    Completed = 4
}

public enum DwellEventType
{
    Arrival = 0,
    Pause = 1,
    Resume = 2,
    Notification60Day = 3,
    AutomaticReturn = 4,
    ManualCalculation = 5,
    StatusChange = 6
}

public enum TruckerPreForecastStatus
{
    ReadyForProcessing = 0,
    AwaitingDetentionPayment = 1,
    PendingReview = 2,
    Completed = 3,
    Cancelled = 4,
    PendingTerminalAssignment = 5,
    PendingCySchedule = 6,
    CyScheduleConfirmed = 7,
    PendingAccountingReview = 8,
    AwaitingRenewalPayment = 9,
}

/// <summary>ICS standard container identity views for pre-forecast photo dossier.</summary>
public enum ContainerPhotoCategory
{
    Flooring = 0,
    RightSideIn = 1,
    LeftSideIn = 2,
    Back = 3,
    Front = 4,
    LeftSideOut = 5,
    RightSideOut = 6,
    Damage = 7,
    Others = 8,
    CroEdo = 9
}
