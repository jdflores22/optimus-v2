using Optimus.Domain.Enums;

namespace Optimus.Application.Yard;

public static class ContainerPhotoCatalog
{
    public static readonly ContainerPhotoCategory[] RequiredViews =
    {
        ContainerPhotoCategory.Flooring,
        ContainerPhotoCategory.RightSideIn,
        ContainerPhotoCategory.LeftSideIn,
        ContainerPhotoCategory.Back,
        ContainerPhotoCategory.Front,
        ContainerPhotoCategory.LeftSideOut,
        ContainerPhotoCategory.RightSideOut,
    };

    public static string GetLabel(ContainerPhotoCategory category) => category switch
    {
        ContainerPhotoCategory.Flooring => "Flooring",
        ContainerPhotoCategory.RightSideIn => "Right side (in)",
        ContainerPhotoCategory.LeftSideIn => "Left side (in)",
        ContainerPhotoCategory.Back => "Back",
        ContainerPhotoCategory.Front => "Front",
        ContainerPhotoCategory.LeftSideOut => "Left side (out)",
        ContainerPhotoCategory.RightSideOut => "Right side (out)",
        ContainerPhotoCategory.Damage => "Damage",
        ContainerPhotoCategory.Others => "Others (optional)",
        ContainerPhotoCategory.CroEdo => "CRO / eDO",
        _ => category.ToString(),
    };

    public static bool IsRequired(ContainerPhotoCategory category)
        => RequiredViews.Contains(category);
}
