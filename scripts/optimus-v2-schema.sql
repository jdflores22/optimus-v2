CREATE TABLE IF NOT EXISTS `__EFMigrationsHistory` (
    `MigrationId` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `ProductVersion` varchar(32) CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK___EFMigrationsHistory` PRIMARY KEY (`MigrationId`)
) CHARACTER SET=utf8mb4;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    ALTER DATABASE CHARACTER SET utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE TABLE `regions` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `Code` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `Name` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_regions` PRIMARY KEY (`Id`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE TABLE `provinces` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `RegionId` char(36) COLLATE ascii_general_ci NOT NULL,
        `Code` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `Name` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_provinces` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_provinces_regions_RegionId` FOREIGN KEY (`RegionId`) REFERENCES `regions` (`Id`) ON DELETE RESTRICT
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE TABLE `cities` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `ProvinceId` char(36) COLLATE ascii_general_ci NOT NULL,
        `Code` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `Name` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_cities` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_cities_provinces_ProvinceId` FOREIGN KEY (`ProvinceId`) REFERENCES `provinces` (`Id`) ON DELETE RESTRICT
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE TABLE `barangays` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `CityId` char(36) COLLATE ascii_general_ci NOT NULL,
        `Code` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `Name` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_barangays` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_barangays_cities_CityId` FOREIGN KEY (`CityId`) REFERENCES `cities` (`Id`) ON DELETE RESTRICT
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE TABLE `consignee_broker_relationships` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `ConsigneeId` char(36) COLLATE ascii_general_ci NOT NULL,
        `BrokerId` char(36) COLLATE ascii_general_ci NOT NULL,
        `ReferralCodeId` char(36) COLLATE ascii_general_ci NOT NULL,
        `Status` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `SuspendedAt` datetime(6) NULL,
        `SuspensionReason` varchar(500) CHARACTER SET utf8mb4 NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_consignee_broker_relationships` PRIMARY KEY (`Id`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE TABLE `pending_users` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `Email` varchar(180) CHARACTER SET utf8mb4 NOT NULL,
        `FirstName` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
        `LastName` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
        `Role` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
        `AcceptanceToken` varchar(64) CHARACTER SET utf8mb4 NOT NULL,
        `TokenExpiresAt` datetime(6) NOT NULL,
        `Status` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `DisabledUntil` datetime(6) NULL,
        `CreatedByAdminId` char(36) COLLATE ascii_general_ci NOT NULL,
        `ShippingLineId` char(36) COLLATE ascii_general_ci NULL,
        `ShippingLineAdminId` char(36) COLLATE ascii_general_ci NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_pending_users` PRIMARY KEY (`Id`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE TABLE `referral_codes` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `ConsigneeId` char(36) COLLATE ascii_general_ci NOT NULL,
        `Code` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
        `IsActive` tinyint(1) NOT NULL,
        `MaxUses` int NULL,
        `CurrentUses` int NOT NULL,
        `ExpiresAt` datetime(6) NULL,
        `CreatedByUserId` char(36) COLLATE ascii_general_ci NOT NULL,
        `DeactivatedAt` datetime(6) NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_referral_codes` PRIMARY KEY (`Id`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE TABLE `refresh_tokens` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
        `TokenHash` varchar(128) CHARACTER SET utf8mb4 NOT NULL,
        `ExpiresAt` datetime(6) NOT NULL,
        `RevokedAt` datetime(6) NULL,
        `ReplacedByTokenHash` longtext CHARACTER SET utf8mb4 NULL,
        `CreatedByIp` longtext CHARACTER SET utf8mb4 NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_refresh_tokens` PRIMARY KEY (`Id`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE TABLE `role_permission_configurations` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `ShippingLineId` char(36) COLLATE ascii_general_ci NOT NULL,
        `Role` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
        `PermissionKey` varchar(120) CHARACTER SET utf8mb4 NOT NULL,
        `IsAllowed` tinyint(1) NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_role_permission_configurations` PRIMARY KEY (`Id`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE TABLE `shipping_line_configurations` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `ShippingLineId` char(36) COLLATE ascii_general_ci NOT NULL,
        `Key` varchar(120) CHARACTER SET utf8mb4 NOT NULL,
        `Value` varchar(2000) CHARACTER SET utf8mb4 NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_shipping_line_configurations` PRIMARY KEY (`Id`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE TABLE `shipping_lines` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `BrandName` varchar(180) CHARACTER SET utf8mb4 NOT NULL,
        `LogoPath` varchar(500) CHARACTER SET utf8mb4 NULL,
        `BrandColor` varchar(20) CHARACTER SET utf8mb4 NULL,
        `PortalConfigJson` json NULL,
        `IsActive` tinyint(1) NOT NULL,
        `AssignedAdminUserId` char(36) COLLATE ascii_general_ci NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_shipping_lines` PRIMARY KEY (`Id`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE TABLE `users` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `Email` varchar(180) CHARACTER SET utf8mb4 NOT NULL,
        `PasswordHash` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
        `FirstName` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
        `LastName` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
        `Role` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
        `UserType` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `Status` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `IsActive` tinyint(1) NOT NULL,
        `EmailVerified` tinyint(1) NOT NULL,
        `EmailVerificationToken` varchar(128) CHARACTER SET utf8mb4 NULL,
        `EmailVerificationExpiresAt` datetime(6) NULL,
        `EmailVerifiedAt` datetime(6) NULL,
        `PasswordResetOtpHash` varchar(128) CHARACTER SET utf8mb4 NULL,
        `PasswordResetOtpExpiresAt` datetime(6) NULL,
        `FailedLoginAttempts` int NOT NULL,
        `LockoutEnd` datetime(6) NULL,
        `LastLoginAt` datetime(6) NULL,
        `DeactivatedAt` datetime(6) NULL,
        `DeactivationReason` varchar(500) CHARACTER SET utf8mb4 NULL,
        `ManagedShippingLineId` char(36) COLLATE ascii_general_ci NULL,
        `ShippingLineAdminId` char(36) COLLATE ascii_general_ci NULL,
        `type` longtext CHARACTER SET utf8mb4 NOT NULL,
        `BusinessAddress` varchar(500) CHARACTER SET utf8mb4 NULL,
        `ActiveWorkspaceConsigneeId` char(36) COLLATE ascii_general_ci NULL,
        `BusinessName` varchar(255) CHARACTER SET utf8mb4 NULL,
        `StaffUser_Department` varchar(120) CHARACTER SET utf8mb4 NULL,
        `Department` varchar(120) CHARACTER SET utf8mb4 NULL,
        `TerminalPermissionsJson` json NULL,
        `PhoneNumber` varchar(40) CHARACTER SET utf8mb4 NULL,
        `LicenseNumber` varchar(80) CHARACTER SET utf8mb4 NULL,
        `CompanyName` varchar(180) CHARACTER SET utf8mb4 NULL,
        `TruckPlateNumber` varchar(40) CHARACTER SET utf8mb4 NULL,
        `ApiTokenHash` varchar(128) CHARACTER SET utf8mb4 NULL,
        `ApiTokenExpiresAt` datetime(6) NULL,
        `LastActivityAt` datetime(6) NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_users` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_users_shipping_lines_ManagedShippingLineId` FOREIGN KEY (`ManagedShippingLineId`) REFERENCES `shipping_lines` (`Id`) ON DELETE SET NULL,
        CONSTRAINT `FK_users_users_ActiveWorkspaceConsigneeId` FOREIGN KEY (`ActiveWorkspaceConsigneeId`) REFERENCES `users` (`Id`) ON DELETE SET NULL,
        CONSTRAINT `FK_users_users_ShippingLineAdminId` FOREIGN KEY (`ShippingLineAdminId`) REFERENCES `users` (`Id`) ON DELETE RESTRICT
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE TABLE `user_shipping_line_preferences` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
        `LastSelectedShippingLineId` char(36) COLLATE ascii_general_ci NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_user_shipping_line_preferences` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_user_shipping_line_preferences_shipping_lines_LastSelectedSh~` FOREIGN KEY (`LastSelectedShippingLineId`) REFERENCES `shipping_lines` (`Id`) ON DELETE SET NULL,
        CONSTRAINT `FK_user_shipping_line_preferences_users_UserId` FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE INDEX `IX_barangays_CityId` ON `barangays` (`CityId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE UNIQUE INDEX `IX_barangays_Code` ON `barangays` (`Code`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE UNIQUE INDEX `IX_cities_Code` ON `cities` (`Code`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE INDEX `IX_cities_ProvinceId` ON `cities` (`ProvinceId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE INDEX `IX_consignee_broker_relationships_BrokerId` ON `consignee_broker_relationships` (`BrokerId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE UNIQUE INDEX `IX_consignee_broker_relationships_ConsigneeId_BrokerId` ON `consignee_broker_relationships` (`ConsigneeId`, `BrokerId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE INDEX `IX_consignee_broker_relationships_ReferralCodeId` ON `consignee_broker_relationships` (`ReferralCodeId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE UNIQUE INDEX `IX_pending_users_AcceptanceToken` ON `pending_users` (`AcceptanceToken`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE INDEX `IX_pending_users_CreatedByAdminId` ON `pending_users` (`CreatedByAdminId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE INDEX `IX_pending_users_ShippingLineAdminId` ON `pending_users` (`ShippingLineAdminId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE INDEX `IX_pending_users_ShippingLineId` ON `pending_users` (`ShippingLineId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE UNIQUE INDEX `IX_provinces_Code` ON `provinces` (`Code`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE INDEX `IX_provinces_RegionId` ON `provinces` (`RegionId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE UNIQUE INDEX `IX_referral_codes_Code` ON `referral_codes` (`Code`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE INDEX `IX_referral_codes_ConsigneeId` ON `referral_codes` (`ConsigneeId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE UNIQUE INDEX `IX_refresh_tokens_TokenHash` ON `refresh_tokens` (`TokenHash`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE INDEX `IX_refresh_tokens_UserId` ON `refresh_tokens` (`UserId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE UNIQUE INDEX `IX_regions_Code` ON `regions` (`Code`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE UNIQUE INDEX `IX_role_permission_configurations_ShippingLineId_Role_Permissio~` ON `role_permission_configurations` (`ShippingLineId`, `Role`, `PermissionKey`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE UNIQUE INDEX `IX_shipping_line_configurations_ShippingLineId_Key` ON `shipping_line_configurations` (`ShippingLineId`, `Key`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE INDEX `IX_shipping_lines_AssignedAdminUserId` ON `shipping_lines` (`AssignedAdminUserId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE UNIQUE INDEX `IX_shipping_lines_BrandName` ON `shipping_lines` (`BrandName`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE INDEX `IX_user_shipping_line_preferences_LastSelectedShippingLineId` ON `user_shipping_line_preferences` (`LastSelectedShippingLineId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE UNIQUE INDEX `IX_user_shipping_line_preferences_UserId` ON `user_shipping_line_preferences` (`UserId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE INDEX `IX_users_ActiveWorkspaceConsigneeId` ON `users` (`ActiveWorkspaceConsigneeId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE UNIQUE INDEX `IX_users_Email` ON `users` (`Email`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE INDEX `IX_users_ManagedShippingLineId` ON `users` (`ManagedShippingLineId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    CREATE INDEX `IX_users_ShippingLineAdminId` ON `users` (`ShippingLineAdminId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    ALTER TABLE `consignee_broker_relationships` ADD CONSTRAINT `FK_consignee_broker_relationships_referral_codes_ReferralCodeId` FOREIGN KEY (`ReferralCodeId`) REFERENCES `referral_codes` (`Id`) ON DELETE RESTRICT;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    ALTER TABLE `consignee_broker_relationships` ADD CONSTRAINT `FK_consignee_broker_relationships_users_BrokerId` FOREIGN KEY (`BrokerId`) REFERENCES `users` (`Id`) ON DELETE CASCADE;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    ALTER TABLE `consignee_broker_relationships` ADD CONSTRAINT `FK_consignee_broker_relationships_users_ConsigneeId` FOREIGN KEY (`ConsigneeId`) REFERENCES `users` (`Id`) ON DELETE CASCADE;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    ALTER TABLE `pending_users` ADD CONSTRAINT `FK_pending_users_shipping_lines_ShippingLineId` FOREIGN KEY (`ShippingLineId`) REFERENCES `shipping_lines` (`Id`) ON DELETE SET NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    ALTER TABLE `pending_users` ADD CONSTRAINT `FK_pending_users_users_CreatedByAdminId` FOREIGN KEY (`CreatedByAdminId`) REFERENCES `users` (`Id`) ON DELETE RESTRICT;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    ALTER TABLE `pending_users` ADD CONSTRAINT `FK_pending_users_users_ShippingLineAdminId` FOREIGN KEY (`ShippingLineAdminId`) REFERENCES `users` (`Id`) ON DELETE RESTRICT;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    ALTER TABLE `referral_codes` ADD CONSTRAINT `FK_referral_codes_users_ConsigneeId` FOREIGN KEY (`ConsigneeId`) REFERENCES `users` (`Id`) ON DELETE CASCADE;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    ALTER TABLE `refresh_tokens` ADD CONSTRAINT `FK_refresh_tokens_users_UserId` FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`) ON DELETE CASCADE;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    ALTER TABLE `role_permission_configurations` ADD CONSTRAINT `FK_role_permission_configurations_shipping_lines_ShippingLineId` FOREIGN KEY (`ShippingLineId`) REFERENCES `shipping_lines` (`Id`) ON DELETE CASCADE;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    ALTER TABLE `shipping_line_configurations` ADD CONSTRAINT `FK_shipping_line_configurations_shipping_lines_ShippingLineId` FOREIGN KEY (`ShippingLineId`) REFERENCES `shipping_lines` (`Id`) ON DELETE CASCADE;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    ALTER TABLE `shipping_lines` ADD CONSTRAINT `FK_shipping_lines_users_AssignedAdminUserId` FOREIGN KEY (`AssignedAdminUserId`) REFERENCES `users` (`Id`) ON DELETE SET NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806030911_Phase1Identity') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260806030911_Phase1Identity', '7.0.20');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE TABLE `activity_logs` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `ActorId` char(36) COLLATE ascii_general_ci NULL,
        `Action` varchar(120) CHARACTER SET utf8mb4 NOT NULL,
        `EntityType` varchar(80) CHARACTER SET utf8mb4 NOT NULL,
        `EntityId` char(36) COLLATE ascii_general_ci NULL,
        `Details` varchar(2000) CHARACTER SET utf8mb4 NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_activity_logs` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_activity_logs_users_ActorId` FOREIGN KEY (`ActorId`) REFERENCES `users` (`Id`) ON DELETE SET NULL
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE TABLE `bulk_import_jobs` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `FileName` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
        `Status` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `TotalRows` int NOT NULL,
        `ProcessedRows` int NOT NULL,
        `SuccessCount` int NOT NULL,
        `ErrorCount` int NOT NULL,
        `ErrorLog` longtext CHARACTER SET utf8mb4 NULL,
        `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `ShippingLineId` char(36) COLLATE ascii_general_ci NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_bulk_import_jobs` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_bulk_import_jobs_users_CreatedById` FOREIGN KEY (`CreatedById`) REFERENCES `users` (`Id`) ON DELETE RESTRICT
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE TABLE `manifests` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `ManifestNumber` varchar(80) CHARACTER SET utf8mb4 NOT NULL,
        `ShippingLineId` char(36) COLLATE ascii_general_ci NOT NULL,
        `ConsigneeId` char(36) COLLATE ascii_general_ci NULL,
        `BrokerId` char(36) COLLATE ascii_general_ci NULL,
        `VesselName` varchar(180) CHARACTER SET utf8mb4 NULL,
        `VoyageNumber` varchar(80) CHARACTER SET utf8mb4 NULL,
        `ArrivalDate` datetime(6) NULL,
        `BlNumber` varchar(80) CHARACTER SET utf8mb4 NULL,
        `BlFilePath` varchar(500) CHARACTER SET utf8mb4 NULL,
        `BlPdfPath` varchar(500) CHARACTER SET utf8mb4 NULL,
        `ManifestFilePath` varchar(500) CHARACTER SET utf8mb4 NULL,
        `WorkflowState` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_manifests` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_manifests_shipping_lines_ShippingLineId` FOREIGN KEY (`ShippingLineId`) REFERENCES `shipping_lines` (`Id`) ON DELETE RESTRICT,
        CONSTRAINT `FK_manifests_users_BrokerId` FOREIGN KEY (`BrokerId`) REFERENCES `users` (`Id`) ON DELETE SET NULL,
        CONSTRAINT `FK_manifests_users_ConsigneeId` FOREIGN KEY (`ConsigneeId`) REFERENCES `users` (`Id`) ON DELETE SET NULL,
        CONSTRAINT `FK_manifests_users_CreatedById` FOREIGN KEY (`CreatedById`) REFERENCES `users` (`Id`) ON DELETE RESTRICT
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE TABLE `payment_fee_configurations` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `FeeType` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `Amount` decimal(18,2) NOT NULL,
        `ConfiguredById` char(36) COLLATE ascii_general_ci NOT NULL,
        `PreviousAmount` decimal(18,2) NULL,
        `IsActive` tinyint(1) NOT NULL,
        `QrCodePath` varchar(500) CHARACTER SET utf8mb4 NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_payment_fee_configurations` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_payment_fee_configurations_users_ConfiguredById` FOREIGN KEY (`ConfiguredById`) REFERENCES `users` (`Id`) ON DELETE RESTRICT
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE TABLE `billings` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `ManifestId` char(36) COLLATE ascii_general_ci NOT NULL,
        `BillingType` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `FreightCharges` decimal(18,2) NOT NULL,
        `ThcCharges` decimal(18,2) NOT NULL,
        `AdditionalCharges` decimal(18,2) NOT NULL,
        `TotalAmount` decimal(18,2) NOT NULL,
        `Currency` varchar(10) CHARACTER SET utf8mb4 NOT NULL,
        `ExchangeRate` decimal(18,6) NULL,
        `TotalAmountPhp` decimal(18,2) NULL,
        `PdfPath` varchar(500) CHARACTER SET utf8mb4 NULL,
        `GeneratedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `Version` int NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_billings` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_billings_manifests_ManifestId` FOREIGN KEY (`ManifestId`) REFERENCES `manifests` (`Id`) ON DELETE CASCADE,
        CONSTRAINT `FK_billings_users_GeneratedById` FOREIGN KEY (`GeneratedById`) REFERENCES `users` (`Id`) ON DELETE RESTRICT
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE TABLE `noas` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `NoaNumber` varchar(80) CHARACTER SET utf8mb4 NOT NULL,
        `BlNumber` varchar(80) CHARACTER SET utf8mb4 NULL,
        `VesselName` varchar(180) CHARACTER SET utf8mb4 NULL,
        `Eta` datetime(6) NULL,
        `PortLocation` varchar(180) CHARACTER SET utf8mb4 NULL,
        `ConsigneeId` char(36) COLLATE ascii_general_ci NULL,
        `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `PdfPath` varchar(500) CHARACTER SET utf8mb4 NULL,
        `ManifestId` char(36) COLLATE ascii_general_ci NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_noas` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_noas_manifests_ManifestId` FOREIGN KEY (`ManifestId`) REFERENCES `manifests` (`Id`) ON DELETE CASCADE,
        CONSTRAINT `FK_noas_users_ConsigneeId` FOREIGN KEY (`ConsigneeId`) REFERENCES `users` (`Id`) ON DELETE SET NULL,
        CONSTRAINT `FK_noas_users_CreatedById` FOREIGN KEY (`CreatedById`) REFERENCES `users` (`Id`) ON DELETE RESTRICT
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE TABLE `payments` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `ManifestId` char(36) COLLATE ascii_general_ci NOT NULL,
        `ShippingLineId` char(36) COLLATE ascii_general_ci NOT NULL,
        `PaymentType` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `Amount` decimal(18,2) NOT NULL,
        `Currency` varchar(10) CHARACTER SET utf8mb4 NOT NULL,
        `ReceiptFilePath` varchar(500) CHARACTER SET utf8mb4 NULL,
        `OfficialReceiptPath` varchar(500) CHARACTER SET utf8mb4 NULL,
        `Status` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `SubmittedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `ValidatedById` char(36) COLLATE ascii_general_ci NULL,
        `ValidatedAt` datetime(6) NULL,
        `RejectionReason` varchar(500) CHARACTER SET utf8mb4 NULL,
        `Version` int NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_payments` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_payments_manifests_ManifestId` FOREIGN KEY (`ManifestId`) REFERENCES `manifests` (`Id`) ON DELETE CASCADE,
        CONSTRAINT `FK_payments_shipping_lines_ShippingLineId` FOREIGN KEY (`ShippingLineId`) REFERENCES `shipping_lines` (`Id`) ON DELETE RESTRICT,
        CONSTRAINT `FK_payments_users_SubmittedById` FOREIGN KEY (`SubmittedById`) REFERENCES `users` (`Id`) ON DELETE RESTRICT,
        CONSTRAINT `FK_payments_users_ValidatedById` FOREIGN KEY (`ValidatedById`) REFERENCES `users` (`Id`) ON DELETE RESTRICT
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE TABLE `workflow_state_histories` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `ManifestId` char(36) COLLATE ascii_general_ci NOT NULL,
        `FromState` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `ToState` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `ActorId` char(36) COLLATE ascii_general_ci NOT NULL,
        `ActorRole` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
        `TransitionReason` varchar(500) CHARACTER SET utf8mb4 NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_workflow_state_histories` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_workflow_state_histories_manifests_ManifestId` FOREIGN KEY (`ManifestId`) REFERENCES `manifests` (`Id`) ON DELETE CASCADE,
        CONSTRAINT `FK_workflow_state_histories_users_ActorId` FOREIGN KEY (`ActorId`) REFERENCES `users` (`Id`) ON DELETE RESTRICT
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE INDEX `IX_activity_logs_ActorId` ON `activity_logs` (`ActorId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE INDEX `IX_billings_GeneratedById` ON `billings` (`GeneratedById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE UNIQUE INDEX `IX_billings_ManifestId` ON `billings` (`ManifestId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE INDEX `IX_bulk_import_jobs_CreatedById` ON `bulk_import_jobs` (`CreatedById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE INDEX `IX_manifests_BrokerId` ON `manifests` (`BrokerId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE INDEX `IX_manifests_ConsigneeId` ON `manifests` (`ConsigneeId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE INDEX `IX_manifests_CreatedById` ON `manifests` (`CreatedById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE UNIQUE INDEX `IX_manifests_ManifestNumber` ON `manifests` (`ManifestNumber`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE INDEX `IX_manifests_ShippingLineId` ON `manifests` (`ShippingLineId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE INDEX `IX_noas_ConsigneeId` ON `noas` (`ConsigneeId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE INDEX `IX_noas_CreatedById` ON `noas` (`CreatedById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE UNIQUE INDEX `IX_noas_ManifestId` ON `noas` (`ManifestId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE UNIQUE INDEX `IX_noas_NoaNumber` ON `noas` (`NoaNumber`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE INDEX `IX_payment_fee_configurations_ConfiguredById` ON `payment_fee_configurations` (`ConfiguredById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE INDEX `IX_payment_fee_configurations_FeeType_IsActive` ON `payment_fee_configurations` (`FeeType`, `IsActive`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE INDEX `IX_payments_ManifestId` ON `payments` (`ManifestId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE INDEX `IX_payments_ShippingLineId` ON `payments` (`ShippingLineId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE INDEX `IX_payments_SubmittedById` ON `payments` (`SubmittedById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE INDEX `IX_payments_ValidatedById` ON `payments` (`ValidatedById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE INDEX `IX_workflow_state_histories_ActorId` ON `workflow_state_histories` (`ActorId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    CREATE INDEX `IX_workflow_state_histories_ManifestId` ON `workflow_state_histories` (`ManifestId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806032103_Phase2CargoChain') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260806032103_Phase2CargoChain', '7.0.20');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE TABLE `document_verifications` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `VerificationToken` varchar(64) CHARACTER SET utf8mb4 NOT NULL,
        `DocumentType` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `SubjectType` varchar(64) CHARACTER SET utf8mb4 NOT NULL,
        `SubjectId` char(36) COLLATE ascii_general_ci NOT NULL,
        `DocumentNumber` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
        `SummaryJson` json NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_document_verifications` PRIMARY KEY (`Id`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE TABLE `edo_generation_sessions` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `SessionId` varchar(36) CHARACTER SET utf8mb4 NOT NULL,
        `ManifestId` char(36) COLLATE ascii_general_ci NOT NULL,
        `InitiatedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `Status` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `TotalItems` int NOT NULL,
        `CompletedItems` int NOT NULL,
        `FailedItems` int NOT NULL,
        `CurrentItem` varchar(80) CHARACTER SET utf8mb4 NULL,
        `ExpirationDate` datetime(6) NULL,
        `FailuresJson` longtext CHARACTER SET utf8mb4 NULL,
        `StartedAt` datetime(6) NOT NULL,
        `CompletedAt` datetime(6) NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_edo_generation_sessions` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_edo_generation_sessions_manifests_ManifestId` FOREIGN KEY (`ManifestId`) REFERENCES `manifests` (`Id`) ON DELETE CASCADE,
        CONSTRAINT `FK_edo_generation_sessions_users_InitiatedById` FOREIGN KEY (`InitiatedById`) REFERENCES `users` (`Id`) ON DELETE RESTRICT
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE TABLE `electronic_delivery_orders` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `EdoNumber` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
        `ManifestId` char(36) COLLATE ascii_general_ci NOT NULL,
        `ShippingLineId` char(36) COLLATE ascii_general_ci NOT NULL,
        `ContainerNumber` varchar(50) CHARACTER SET utf8mb4 NULL,
        `FeeAmount` decimal(18,2) NULL,
        `PdfPath` varchar(500) CHARACTER SET utf8mb4 NULL,
        `QrPayload` varchar(500) CHARACTER SET utf8mb4 NULL,
        `QrImagePath` varchar(500) CHARACTER SET utf8mb4 NULL,
        `Status` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `GeneratedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `GeneratedAt` datetime(6) NOT NULL,
        `ReleasedById` char(36) COLLATE ascii_general_ci NULL,
        `ReleasedAt` datetime(6) NULL,
        `ExpiresAt` datetime(6) NULL,
        `ExpiredDays` int NULL,
        `CyLocation` varchar(100) CHARACTER SET utf8mb4 NULL,
        `AdditionalNotes` varchar(2000) CHARACTER SET utf8mb4 NULL,
        `RejectionReason` varchar(1000) CHARACTER SET utf8mb4 NULL,
        `Version` int NOT NULL,
        `PreviousVersionId` char(36) COLLATE ascii_general_ci NULL,
        `VerificationToken` varchar(64) CHARACTER SET utf8mb4 NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_electronic_delivery_orders` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_electronic_delivery_orders_electronic_delivery_orders_Previo~` FOREIGN KEY (`PreviousVersionId`) REFERENCES `electronic_delivery_orders` (`Id`) ON DELETE SET NULL,
        CONSTRAINT `FK_electronic_delivery_orders_manifests_ManifestId` FOREIGN KEY (`ManifestId`) REFERENCES `manifests` (`Id`) ON DELETE CASCADE,
        CONSTRAINT `FK_electronic_delivery_orders_shipping_lines_ShippingLineId` FOREIGN KEY (`ShippingLineId`) REFERENCES `shipping_lines` (`Id`) ON DELETE RESTRICT,
        CONSTRAINT `FK_electronic_delivery_orders_users_GeneratedById` FOREIGN KEY (`GeneratedById`) REFERENCES `users` (`Id`) ON DELETE RESTRICT,
        CONSTRAINT `FK_electronic_delivery_orders_users_ReleasedById` FOREIGN KEY (`ReleasedById`) REFERENCES `users` (`Id`) ON DELETE RESTRICT
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE TABLE `edo_access_logs` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `EdoId` char(36) COLLATE ascii_general_ci NOT NULL,
        `AccessedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `AccessedAt` datetime(6) NOT NULL,
        `IpAddress` varchar(45) CHARACTER SET utf8mb4 NULL,
        `AccessResult` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_edo_access_logs` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_edo_access_logs_electronic_delivery_orders_EdoId` FOREIGN KEY (`EdoId`) REFERENCES `electronic_delivery_orders` (`Id`) ON DELETE CASCADE,
        CONSTRAINT `FK_edo_access_logs_users_AccessedById` FOREIGN KEY (`AccessedById`) REFERENCES `users` (`Id`) ON DELETE RESTRICT
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE TABLE `edo_payments` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `ManifestId` char(36) COLLATE ascii_general_ci NOT NULL,
        `EdoId` char(36) COLLATE ascii_general_ci NULL,
        `ShippingLineId` char(36) COLLATE ascii_general_ci NOT NULL,
        `Amount` decimal(18,2) NOT NULL,
        `Currency` varchar(10) CHARACTER SET utf8mb4 NOT NULL,
        `ReceiptFilePath` varchar(500) CHARACTER SET utf8mb4 NULL,
        `OfficialReceiptPath` varchar(500) CHARACTER SET utf8mb4 NULL,
        `Status` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `SubmittedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `ValidatedById` char(36) COLLATE ascii_general_ci NULL,
        `ValidatedAt` datetime(6) NULL,
        `RejectionReason` varchar(500) CHARACTER SET utf8mb4 NULL,
        `Version` int NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_edo_payments` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_edo_payments_electronic_delivery_orders_EdoId` FOREIGN KEY (`EdoId`) REFERENCES `electronic_delivery_orders` (`Id`) ON DELETE SET NULL,
        CONSTRAINT `FK_edo_payments_manifests_ManifestId` FOREIGN KEY (`ManifestId`) REFERENCES `manifests` (`Id`) ON DELETE CASCADE,
        CONSTRAINT `FK_edo_payments_shipping_lines_ShippingLineId` FOREIGN KEY (`ShippingLineId`) REFERENCES `shipping_lines` (`Id`) ON DELETE RESTRICT,
        CONSTRAINT `FK_edo_payments_users_SubmittedById` FOREIGN KEY (`SubmittedById`) REFERENCES `users` (`Id`) ON DELETE RESTRICT,
        CONSTRAINT `FK_edo_payments_users_ValidatedById` FOREIGN KEY (`ValidatedById`) REFERENCES `users` (`Id`) ON DELETE RESTRICT
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE TABLE `edo_release_history` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `EdoId` char(36) COLLATE ascii_general_ci NOT NULL,
        `FromStatus` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `ToStatus` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `ActorId` char(36) COLLATE ascii_general_ci NOT NULL,
        `RejectionReason` varchar(1000) CHARACTER SET utf8mb4 NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_edo_release_history` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_edo_release_history_electronic_delivery_orders_EdoId` FOREIGN KEY (`EdoId`) REFERENCES `electronic_delivery_orders` (`Id`) ON DELETE CASCADE,
        CONSTRAINT `FK_edo_release_history_users_ActorId` FOREIGN KEY (`ActorId`) REFERENCES `users` (`Id`) ON DELETE RESTRICT
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE TABLE `edo_renewal_requests` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `ExpiredEdoId` char(36) COLLATE ascii_general_ci NOT NULL,
        `NewEdoId` char(36) COLLATE ascii_general_ci NULL,
        `RequestedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `RequestedAt` datetime(6) NOT NULL,
        `EmptyContainerReturnDate` datetime(6) NOT NULL,
        `OverdueDays` int NOT NULL,
        `DetentionChargeAmount` decimal(18,2) NOT NULL,
        `Status` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `DetentionBillingId` char(36) COLLATE ascii_general_ci NULL,
        `PaymentVerified` tinyint(1) NOT NULL,
        `PaymentVerifiedAt` datetime(6) NULL,
        `PaymentVerifiedById` char(36) COLLATE ascii_general_ci NULL,
        `AdditionalNotes` varchar(2000) CHARACTER SET utf8mb4 NULL,
        `CompletedAt` datetime(6) NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_edo_renewal_requests` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_edo_renewal_requests_billings_DetentionBillingId` FOREIGN KEY (`DetentionBillingId`) REFERENCES `billings` (`Id`) ON DELETE SET NULL,
        CONSTRAINT `FK_edo_renewal_requests_electronic_delivery_orders_ExpiredEdoId` FOREIGN KEY (`ExpiredEdoId`) REFERENCES `electronic_delivery_orders` (`Id`) ON DELETE CASCADE,
        CONSTRAINT `FK_edo_renewal_requests_electronic_delivery_orders_NewEdoId` FOREIGN KEY (`NewEdoId`) REFERENCES `electronic_delivery_orders` (`Id`) ON DELETE SET NULL,
        CONSTRAINT `FK_edo_renewal_requests_users_PaymentVerifiedById` FOREIGN KEY (`PaymentVerifiedById`) REFERENCES `users` (`Id`) ON DELETE RESTRICT,
        CONSTRAINT `FK_edo_renewal_requests_users_RequestedById` FOREIGN KEY (`RequestedById`) REFERENCES `users` (`Id`) ON DELETE RESTRICT
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE TABLE `edo_versions` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `EdoId` char(36) COLLATE ascii_general_ci NOT NULL,
        `VersionNumber` int NOT NULL,
        `PdfPath` varchar(500) CHARACTER SET utf8mb4 NULL,
        `EdoNumber` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
        `Status` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `CreatedById` char(36) COLLATE ascii_general_ci NULL,
        `ExpiresAt` datetime(6) NULL,
        `CyLocation` varchar(100) CHARACTER SET utf8mb4 NULL,
        `Notes` varchar(2000) CHARACTER SET utf8mb4 NULL,
        `IsCurrent` tinyint(1) NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_edo_versions` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_edo_versions_electronic_delivery_orders_EdoId` FOREIGN KEY (`EdoId`) REFERENCES `electronic_delivery_orders` (`Id`) ON DELETE CASCADE,
        CONSTRAINT `FK_edo_versions_users_CreatedById` FOREIGN KEY (`CreatedById`) REFERENCES `users` (`Id`) ON DELETE SET NULL
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE UNIQUE INDEX `IX_document_verifications_DocumentType_SubjectType_SubjectId` ON `document_verifications` (`DocumentType`, `SubjectType`, `SubjectId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE UNIQUE INDEX `IX_document_verifications_VerificationToken` ON `document_verifications` (`VerificationToken`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE INDEX `IX_edo_access_logs_AccessedById` ON `edo_access_logs` (`AccessedById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE INDEX `IX_edo_access_logs_EdoId` ON `edo_access_logs` (`EdoId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE INDEX `IX_edo_generation_sessions_InitiatedById` ON `edo_generation_sessions` (`InitiatedById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE INDEX `IX_edo_generation_sessions_ManifestId` ON `edo_generation_sessions` (`ManifestId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE UNIQUE INDEX `IX_edo_generation_sessions_SessionId` ON `edo_generation_sessions` (`SessionId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE INDEX `IX_edo_payments_EdoId` ON `edo_payments` (`EdoId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE INDEX `IX_edo_payments_ManifestId` ON `edo_payments` (`ManifestId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE INDEX `IX_edo_payments_ShippingLineId` ON `edo_payments` (`ShippingLineId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE INDEX `IX_edo_payments_SubmittedById` ON `edo_payments` (`SubmittedById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE INDEX `IX_edo_payments_ValidatedById` ON `edo_payments` (`ValidatedById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE INDEX `IX_edo_release_history_ActorId` ON `edo_release_history` (`ActorId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE INDEX `IX_edo_release_history_EdoId` ON `edo_release_history` (`EdoId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE INDEX `IX_edo_renewal_requests_DetentionBillingId` ON `edo_renewal_requests` (`DetentionBillingId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE INDEX `IX_edo_renewal_requests_ExpiredEdoId` ON `edo_renewal_requests` (`ExpiredEdoId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE INDEX `IX_edo_renewal_requests_NewEdoId` ON `edo_renewal_requests` (`NewEdoId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE INDEX `IX_edo_renewal_requests_PaymentVerifiedById` ON `edo_renewal_requests` (`PaymentVerifiedById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE INDEX `IX_edo_renewal_requests_RequestedById` ON `edo_renewal_requests` (`RequestedById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE INDEX `IX_edo_versions_CreatedById` ON `edo_versions` (`CreatedById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE UNIQUE INDEX `IX_edo_versions_EdoId_VersionNumber` ON `edo_versions` (`EdoId`, `VersionNumber`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE UNIQUE INDEX `IX_electronic_delivery_orders_EdoNumber` ON `electronic_delivery_orders` (`EdoNumber`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE INDEX `IX_electronic_delivery_orders_GeneratedById` ON `electronic_delivery_orders` (`GeneratedById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE INDEX `IX_electronic_delivery_orders_ManifestId` ON `electronic_delivery_orders` (`ManifestId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE INDEX `IX_electronic_delivery_orders_PreviousVersionId` ON `electronic_delivery_orders` (`PreviousVersionId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE INDEX `IX_electronic_delivery_orders_ReleasedById` ON `electronic_delivery_orders` (`ReleasedById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE INDEX `IX_electronic_delivery_orders_ShippingLineId` ON `electronic_delivery_orders` (`ShippingLineId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    CREATE INDEX `IX_electronic_delivery_orders_VerificationToken` ON `electronic_delivery_orders` (`VerificationToken`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806033654_Phase3EdoCro') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260806033654_Phase3EdoCro', '7.0.20');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE TABLE `container_sizes` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `Name` varchar(80) CHARACTER SET utf8mb4 NOT NULL,
        `Code` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `TeuValue` decimal(8,2) NOT NULL,
        `Description` varchar(500) CHARACTER SET utf8mb4 NULL,
        `IsActive` tinyint(1) NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_container_sizes` PRIMARY KEY (`Id`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE TABLE `container_types` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `Name` varchar(80) CHARACTER SET utf8mb4 NOT NULL,
        `Code` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `Description` varchar(500) CHARACTER SET utf8mb4 NULL,
        `IsActive` tinyint(1) NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_container_types` PRIMARY KEY (`Id`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE TABLE `dwell_time_configurations` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `NotificationThresholdDays` int NOT NULL,
        `AutomaticReturnThresholdDays` int NOT NULL,
        `Timezone` varchar(80) CHARACTER SET utf8mb4 NOT NULL,
        `EnableAutomaticReturns` tinyint(1) NOT NULL,
        `EnableNotifications` tinyint(1) NOT NULL,
        `IsActive` tinyint(1) NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_dwell_time_configurations` PRIMARY KEY (`Id`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE TABLE `in_app_notifications` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `UserId` char(36) COLLATE ascii_general_ci NULL,
        `Title` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
        `Message` varchar(2000) CHARACTER SET utf8mb4 NOT NULL,
        `Category` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `SubjectType` varchar(80) CHARACTER SET utf8mb4 NULL,
        `SubjectId` char(36) COLLATE ascii_general_ci NULL,
        `IsRead` tinyint(1) NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_in_app_notifications` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_in_app_notifications_users_UserId` FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE TABLE `terminals` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `Name` varchar(120) CHARACTER SET utf8mb4 NOT NULL,
        `Code` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `Identity` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `Kind` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `Location` varchar(200) CHARACTER SET utf8mb4 NULL,
        `Region` varchar(80) CHARACTER SET utf8mb4 NULL,
        `City` varchar(80) CHARACTER SET utf8mb4 NULL,
        `DailyCapacity` int NOT NULL,
        `IsActive` tinyint(1) NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_terminals` PRIMARY KEY (`Id`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE TABLE `shipping_line_terminal_allocations` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `ShippingLineId` char(36) COLLATE ascii_general_ci NOT NULL,
        `TerminalId` char(36) COLLATE ascii_general_ci NOT NULL,
        `StaffUserId` char(36) COLLATE ascii_general_ci NULL,
        `AllocatedCapacityTeu` int NOT NULL,
        `Capacity20Ft` int NOT NULL,
        `Capacity40Ft` int NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_shipping_line_terminal_allocations` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_shipping_line_terminal_allocations_shipping_lines_ShippingLi~` FOREIGN KEY (`ShippingLineId`) REFERENCES `shipping_lines` (`Id`) ON DELETE CASCADE,
        CONSTRAINT `FK_shipping_line_terminal_allocations_terminals_TerminalId` FOREIGN KEY (`TerminalId`) REFERENCES `terminals` (`Id`) ON DELETE CASCADE,
        CONSTRAINT `FK_shipping_line_terminal_allocations_users_StaffUserId` FOREIGN KEY (`StaffUserId`) REFERENCES `users` (`Id`) ON DELETE SET NULL
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE TABLE `terminal_slots` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `TerminalId` char(36) COLLATE ascii_general_ci NOT NULL,
        `Date` date NOT NULL,
        `Capacity` int NOT NULL,
        `AssignedCount` int NOT NULL,
        `Status` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_terminal_slots` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_terminal_slots_terminals_TerminalId` FOREIGN KEY (`TerminalId`) REFERENCES `terminals` (`Id`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE TABLE `containers` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `ContainerNumber` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `ShippingLineId` char(36) COLLATE ascii_general_ci NOT NULL,
        `ManifestId` char(36) COLLATE ascii_general_ci NULL,
        `ContainerTypeId` char(36) COLLATE ascii_general_ci NULL,
        `ContainerSizeId` char(36) COLLATE ascii_general_ci NULL,
        `Status` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `CurrentLocation` varchar(120) CHARACTER SET utf8mb4 NULL,
        `ExpectedReturnDate` datetime(6) NULL,
        `CyAllocationId` char(36) COLLATE ascii_general_ci NULL,
        `AllocationStatus` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `AllocatedAt` datetime(6) NULL,
        `AllocationLockedAt` datetime(6) NULL,
        `TerminalArrivalDate` datetime(6) NULL,
        `CurrentDwellDays` int NOT NULL,
        `LastDwellCalculationAt` datetime(6) NULL,
        `DwellPausedAt` datetime(6) NULL,
        `TotalPausedDays` int NOT NULL,
        `NextNotificationDate` datetime(6) NULL,
        `AutomaticReturnDate` datetime(6) NULL,
        `StackBay` varchar(20) CHARACTER SET utf8mb4 NULL,
        `StackRow` varchar(20) CHARACTER SET utf8mb4 NULL,
        `StackTier` varchar(20) CHARACTER SET utf8mb4 NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_containers` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_containers_container_sizes_ContainerSizeId` FOREIGN KEY (`ContainerSizeId`) REFERENCES `container_sizes` (`Id`) ON DELETE SET NULL,
        CONSTRAINT `FK_containers_container_types_ContainerTypeId` FOREIGN KEY (`ContainerTypeId`) REFERENCES `container_types` (`Id`) ON DELETE SET NULL,
        CONSTRAINT `FK_containers_manifests_ManifestId` FOREIGN KEY (`ManifestId`) REFERENCES `manifests` (`Id`) ON DELETE SET NULL,
        CONSTRAINT `FK_containers_shipping_line_terminal_allocations_CyAllocationId` FOREIGN KEY (`CyAllocationId`) REFERENCES `shipping_line_terminal_allocations` (`Id`) ON DELETE SET NULL,
        CONSTRAINT `FK_containers_shipping_lines_ShippingLineId` FOREIGN KEY (`ShippingLineId`) REFERENCES `shipping_lines` (`Id`) ON DELETE RESTRICT
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE TABLE `container_allocation_audits` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `ContainerId` char(36) COLLATE ascii_general_ci NOT NULL,
        `PreviousAllocationId` char(36) COLLATE ascii_general_ci NULL,
        `NewAllocationId` char(36) COLLATE ascii_general_ci NULL,
        `ChangedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `ChangedAt` datetime(6) NOT NULL,
        `ChangeType` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `Reason` varchar(500) CHARACTER SET utf8mb4 NULL,
        `MetadataJson` longtext CHARACTER SET utf8mb4 NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_container_allocation_audits` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_container_allocation_audits_containers_ContainerId` FOREIGN KEY (`ContainerId`) REFERENCES `containers` (`Id`) ON DELETE CASCADE,
        CONSTRAINT `FK_container_allocation_audits_users_ChangedById` FOREIGN KEY (`ChangedById`) REFERENCES `users` (`Id`) ON DELETE RESTRICT
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE TABLE `dwell_time_events` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `ContainerId` char(36) COLLATE ascii_general_ci NOT NULL,
        `EventType` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `EventDate` datetime(6) NOT NULL,
        `DwellDaysAtEvent` int NOT NULL,
        `Reason` varchar(500) CHARACTER SET utf8mb4 NULL,
        `MetadataJson` longtext CHARACTER SET utf8mb4 NULL,
        `TriggeredById` char(36) COLLATE ascii_general_ci NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_dwell_time_events` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_dwell_time_events_containers_ContainerId` FOREIGN KEY (`ContainerId`) REFERENCES `containers` (`Id`) ON DELETE CASCADE,
        CONSTRAINT `FK_dwell_time_events_users_TriggeredById` FOREIGN KEY (`TriggeredById`) REFERENCES `users` (`Id`) ON DELETE SET NULL
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE TABLE `pre_advice_requests` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `TruckerId` char(36) COLLATE ascii_general_ci NOT NULL,
        `ContainerId` char(36) COLLATE ascii_general_ci NOT NULL,
        `TerminalId` char(36) COLLATE ascii_general_ci NOT NULL,
        `AssignedSlotId` char(36) COLLATE ascii_general_ci NULL,
        `ShippingLineId` char(36) COLLATE ascii_general_ci NULL,
        `Status` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `VerifiedById` char(36) COLLATE ascii_general_ci NULL,
        `VerifiedAt` datetime(6) NULL,
        `RejectionReason` varchar(1000) CHARACTER SET utf8mb4 NULL,
        `PaymentReference` varchar(100) CHARACTER SET utf8mb4 NULL,
        `PaymentVerified` tinyint(1) NOT NULL,
        `QrCodePath` varchar(500) CHARACTER SET utf8mb4 NULL,
        `PackagePdfPath` varchar(500) CHARACTER SET utf8mb4 NULL,
        `EdoNumber` varchar(100) CHARACTER SET utf8mb4 NULL,
        `VerificationToken` varchar(64) CHARACTER SET utf8mb4 NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_pre_advice_requests` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_pre_advice_requests_containers_ContainerId` FOREIGN KEY (`ContainerId`) REFERENCES `containers` (`Id`) ON DELETE RESTRICT,
        CONSTRAINT `FK_pre_advice_requests_shipping_lines_ShippingLineId` FOREIGN KEY (`ShippingLineId`) REFERENCES `shipping_lines` (`Id`) ON DELETE SET NULL,
        CONSTRAINT `FK_pre_advice_requests_terminal_slots_AssignedSlotId` FOREIGN KEY (`AssignedSlotId`) REFERENCES `terminal_slots` (`Id`) ON DELETE SET NULL,
        CONSTRAINT `FK_pre_advice_requests_terminals_TerminalId` FOREIGN KEY (`TerminalId`) REFERENCES `terminals` (`Id`) ON DELETE RESTRICT,
        CONSTRAINT `FK_pre_advice_requests_users_TruckerId` FOREIGN KEY (`TruckerId`) REFERENCES `users` (`Id`) ON DELETE RESTRICT,
        CONSTRAINT `FK_pre_advice_requests_users_VerifiedById` FOREIGN KEY (`VerifiedById`) REFERENCES `users` (`Id`) ON DELETE SET NULL
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE TABLE `geotag_photos` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `PreAdviceRequestId` char(36) COLLATE ascii_general_ci NOT NULL,
        `FilePath` varchar(500) CHARACTER SET utf8mb4 NOT NULL,
        `OriginalName` varchar(255) CHARACTER SET utf8mb4 NULL,
        `Latitude` double NULL,
        `Longitude` double NULL,
        `CapturedAt` datetime(6) NOT NULL,
        `IsVerified` tinyint(1) NOT NULL,
        `VerificationNotes` varchar(500) CHARACTER SET utf8mb4 NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_geotag_photos` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_geotag_photos_pre_advice_requests_PreAdviceRequestId` FOREIGN KEY (`PreAdviceRequestId`) REFERENCES `pre_advice_requests` (`Id`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE INDEX `IX_container_allocation_audits_ChangedById` ON `container_allocation_audits` (`ChangedById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE INDEX `IX_container_allocation_audits_ContainerId` ON `container_allocation_audits` (`ContainerId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE UNIQUE INDEX `IX_container_sizes_Code` ON `container_sizes` (`Code`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE UNIQUE INDEX `IX_container_types_Code` ON `container_types` (`Code`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE UNIQUE INDEX `IX_containers_ContainerNumber` ON `containers` (`ContainerNumber`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE INDEX `IX_containers_ContainerSizeId` ON `containers` (`ContainerSizeId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE INDEX `IX_containers_ContainerTypeId` ON `containers` (`ContainerTypeId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE INDEX `IX_containers_CyAllocationId` ON `containers` (`CyAllocationId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE INDEX `IX_containers_ManifestId` ON `containers` (`ManifestId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE INDEX `IX_containers_ShippingLineId` ON `containers` (`ShippingLineId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE INDEX `IX_dwell_time_events_ContainerId` ON `dwell_time_events` (`ContainerId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE INDEX `IX_dwell_time_events_TriggeredById` ON `dwell_time_events` (`TriggeredById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE INDEX `IX_geotag_photos_PreAdviceRequestId` ON `geotag_photos` (`PreAdviceRequestId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE INDEX `IX_in_app_notifications_UserId` ON `in_app_notifications` (`UserId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE INDEX `IX_pre_advice_requests_AssignedSlotId` ON `pre_advice_requests` (`AssignedSlotId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE INDEX `IX_pre_advice_requests_ContainerId` ON `pre_advice_requests` (`ContainerId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE INDEX `IX_pre_advice_requests_ShippingLineId` ON `pre_advice_requests` (`ShippingLineId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE INDEX `IX_pre_advice_requests_TerminalId` ON `pre_advice_requests` (`TerminalId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE INDEX `IX_pre_advice_requests_TruckerId` ON `pre_advice_requests` (`TruckerId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE INDEX `IX_pre_advice_requests_VerifiedById` ON `pre_advice_requests` (`VerifiedById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE UNIQUE INDEX `IX_shipping_line_terminal_allocations_ShippingLineId_TerminalId~` ON `shipping_line_terminal_allocations` (`ShippingLineId`, `TerminalId`, `StaffUserId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE INDEX `IX_shipping_line_terminal_allocations_StaffUserId` ON `shipping_line_terminal_allocations` (`StaffUserId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE INDEX `IX_shipping_line_terminal_allocations_TerminalId` ON `shipping_line_terminal_allocations` (`TerminalId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE UNIQUE INDEX `IX_terminal_slots_TerminalId_Date` ON `terminal_slots` (`TerminalId`, `Date`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    CREATE UNIQUE INDEX `IX_terminals_Code` ON `terminals` (`Code`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806035052_Phase4YardOps') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260806035052_Phase4YardOps', '7.0.20');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    ALTER TABLE `users` ADD `OnboardingCompletedStepsJson` longtext CHARACTER SET utf8mb4 NULL;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE TABLE `broker_transfer_requests` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `ManifestId` char(36) COLLATE ascii_general_ci NOT NULL,
        `ConsigneeId` char(36) COLLATE ascii_general_ci NOT NULL,
        `OldBrokerId` char(36) COLLATE ascii_general_ci NOT NULL,
        `NewBrokerId` char(36) COLLATE ascii_general_ci NOT NULL,
        `Reason` varchar(2000) CHARACTER SET utf8mb4 NOT NULL,
        `TransferLetterPath` varchar(500) CHARACTER SET utf8mb4 NULL,
        `Status` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `RequestedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `RequestedAt` datetime(6) NOT NULL,
        `ReviewedById` char(36) COLLATE ascii_general_ci NULL,
        `ReviewedAt` datetime(6) NULL,
        `ReviewNotes` varchar(1000) CHARACTER SET utf8mb4 NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_broker_transfer_requests` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_broker_transfer_requests_manifests_ManifestId` FOREIGN KEY (`ManifestId`) REFERENCES `manifests` (`Id`) ON DELETE CASCADE,
        CONSTRAINT `FK_broker_transfer_requests_users_ConsigneeId` FOREIGN KEY (`ConsigneeId`) REFERENCES `users` (`Id`) ON DELETE RESTRICT,
        CONSTRAINT `FK_broker_transfer_requests_users_NewBrokerId` FOREIGN KEY (`NewBrokerId`) REFERENCES `users` (`Id`) ON DELETE RESTRICT,
        CONSTRAINT `FK_broker_transfer_requests_users_OldBrokerId` FOREIGN KEY (`OldBrokerId`) REFERENCES `users` (`Id`) ON DELETE RESTRICT,
        CONSTRAINT `FK_broker_transfer_requests_users_RequestedById` FOREIGN KEY (`RequestedById`) REFERENCES `users` (`Id`) ON DELETE RESTRICT,
        CONSTRAINT `FK_broker_transfer_requests_users_ReviewedById` FOREIGN KEY (`ReviewedById`) REFERENCES `users` (`Id`) ON DELETE SET NULL
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE TABLE `form_configurations` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `Name` varchar(120) CHARACTER SET utf8mb4 NOT NULL,
        `Type` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `Version` int NOT NULL,
        `Status` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `FieldsJson` longtext CHARACTER SET utf8mb4 NOT NULL,
        `PublishedAt` datetime(6) NULL,
        `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_form_configurations` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_form_configurations_users_CreatedById` FOREIGN KEY (`CreatedById`) REFERENCES `users` (`Id`) ON DELETE RESTRICT
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE TABLE `repositioning_requests` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `RequestNumber` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `ShippingLineId` char(36) COLLATE ascii_general_ci NOT NULL,
        `RequestType` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `SourceTerminalId` char(36) COLLATE ascii_general_ci NOT NULL,
        `DestinationTerminalId` char(36) COLLATE ascii_general_ci NOT NULL,
        `Purpose` varchar(2000) CHARACTER SET utf8mb4 NOT NULL,
        `RequestLetterPath` varchar(500) CHARACTER SET utf8mb4 NULL,
        `ContainerCount` int NOT NULL,
        `Status` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `RequestedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `RequestedAt` datetime(6) NOT NULL,
        `ReviewedById` char(36) COLLATE ascii_general_ci NULL,
        `ReviewedAt` datetime(6) NULL,
        `ReviewNotes` varchar(1000) CHARACTER SET utf8mb4 NULL,
        `CompletedAt` datetime(6) NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_repositioning_requests` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_repositioning_requests_shipping_lines_ShippingLineId` FOREIGN KEY (`ShippingLineId`) REFERENCES `shipping_lines` (`Id`) ON DELETE CASCADE,
        CONSTRAINT `FK_repositioning_requests_terminals_DestinationTerminalId` FOREIGN KEY (`DestinationTerminalId`) REFERENCES `terminals` (`Id`) ON DELETE RESTRICT,
        CONSTRAINT `FK_repositioning_requests_terminals_SourceTerminalId` FOREIGN KEY (`SourceTerminalId`) REFERENCES `terminals` (`Id`) ON DELETE RESTRICT,
        CONSTRAINT `FK_repositioning_requests_users_RequestedById` FOREIGN KEY (`RequestedById`) REFERENCES `users` (`Id`) ON DELETE RESTRICT,
        CONSTRAINT `FK_repositioning_requests_users_ReviewedById` FOREIGN KEY (`ReviewedById`) REFERENCES `users` (`Id`) ON DELETE SET NULL
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE TABLE `suspension_appeals` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
        `AppealLetter` longtext CHARACTER SET utf8mb4 NOT NULL,
        `AttachmentsJson` longtext CHARACTER SET utf8mb4 NULL,
        `Status` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
        `SubmittedAt` datetime(6) NOT NULL,
        `ReviewedById` char(36) COLLATE ascii_general_ci NULL,
        `ReviewedAt` datetime(6) NULL,
        `ReviewNotes` varchar(1000) CHARACTER SET utf8mb4 NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_suspension_appeals` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_suspension_appeals_users_ReviewedById` FOREIGN KEY (`ReviewedById`) REFERENCES `users` (`Id`) ON DELETE SET NULL,
        CONSTRAINT `FK_suspension_appeals_users_UserId` FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE TABLE `welcome_contents` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `Audience` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `Title` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
        `BodyMarkdown` longtext CHARACTER SET utf8mb4 NOT NULL,
        `StepsJson` longtext CHARACTER SET utf8mb4 NOT NULL,
        `IsActive` tinyint(1) NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_welcome_contents` PRIMARY KEY (`Id`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE TABLE `accreditation_submissions` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `ApplicantId` char(36) COLLATE ascii_general_ci NOT NULL,
        `ShippingLineId` char(36) COLLATE ascii_general_ci NOT NULL,
        `FormConfigurationId` char(36) COLLATE ascii_general_ci NOT NULL,
        `SubmittedDataJson` longtext CHARACTER SET utf8mb4 NOT NULL,
        `Status` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `EvaluatorId` char(36) COLLATE ascii_general_ci NULL,
        `FinalApproverId` char(36) COLLATE ascii_general_ci NULL,
        `SubmittedAt` datetime(6) NOT NULL,
        `EvaluatedAt` datetime(6) NULL,
        `ApprovedAt` datetime(6) NULL,
        `DenialReason` varchar(1000) CHARACTER SET utf8mb4 NULL,
        `ComplianceNotes` varchar(2000) CHARACTER SET utf8mb4 NULL,
        `ComplianceFieldIdsJson` longtext CHARACTER SET utf8mb4 NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_accreditation_submissions` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_accreditation_submissions_form_configurations_FormConfigurat~` FOREIGN KEY (`FormConfigurationId`) REFERENCES `form_configurations` (`Id`) ON DELETE RESTRICT,
        CONSTRAINT `FK_accreditation_submissions_shipping_lines_ShippingLineId` FOREIGN KEY (`ShippingLineId`) REFERENCES `shipping_lines` (`Id`) ON DELETE CASCADE,
        CONSTRAINT `FK_accreditation_submissions_users_ApplicantId` FOREIGN KEY (`ApplicantId`) REFERENCES `users` (`Id`) ON DELETE RESTRICT,
        CONSTRAINT `FK_accreditation_submissions_users_EvaluatorId` FOREIGN KEY (`EvaluatorId`) REFERENCES `users` (`Id`) ON DELETE SET NULL,
        CONSTRAINT `FK_accreditation_submissions_users_FinalApproverId` FOREIGN KEY (`FinalApproverId`) REFERENCES `users` (`Id`) ON DELETE SET NULL
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE TABLE `repositioning_request_items` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `RepositioningRequestId` char(36) COLLATE ascii_general_ci NOT NULL,
        `ContainerId` char(36) COLLATE ascii_general_ci NOT NULL,
        `DwellTimeDays` int NOT NULL,
        `DischargeDate` datetime(6) NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_repositioning_request_items` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_repositioning_request_items_containers_ContainerId` FOREIGN KEY (`ContainerId`) REFERENCES `containers` (`Id`) ON DELETE RESTRICT,
        CONSTRAINT `FK_repositioning_request_items_repositioning_requests_Repositio~` FOREIGN KEY (`RepositioningRequestId`) REFERENCES `repositioning_requests` (`Id`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE UNIQUE INDEX `IX_accreditation_submissions_ApplicantId_ShippingLineId` ON `accreditation_submissions` (`ApplicantId`, `ShippingLineId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE INDEX `IX_accreditation_submissions_EvaluatorId` ON `accreditation_submissions` (`EvaluatorId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE INDEX `IX_accreditation_submissions_FinalApproverId` ON `accreditation_submissions` (`FinalApproverId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE INDEX `IX_accreditation_submissions_FormConfigurationId` ON `accreditation_submissions` (`FormConfigurationId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE INDEX `IX_accreditation_submissions_ShippingLineId` ON `accreditation_submissions` (`ShippingLineId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE INDEX `IX_broker_transfer_requests_ConsigneeId` ON `broker_transfer_requests` (`ConsigneeId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE INDEX `IX_broker_transfer_requests_ManifestId` ON `broker_transfer_requests` (`ManifestId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE INDEX `IX_broker_transfer_requests_NewBrokerId` ON `broker_transfer_requests` (`NewBrokerId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE INDEX `IX_broker_transfer_requests_OldBrokerId` ON `broker_transfer_requests` (`OldBrokerId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE INDEX `IX_broker_transfer_requests_RequestedById` ON `broker_transfer_requests` (`RequestedById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE INDEX `IX_broker_transfer_requests_ReviewedById` ON `broker_transfer_requests` (`ReviewedById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE INDEX `IX_form_configurations_CreatedById` ON `form_configurations` (`CreatedById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE INDEX `IX_form_configurations_Type_Version` ON `form_configurations` (`Type`, `Version`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE INDEX `IX_repositioning_request_items_ContainerId` ON `repositioning_request_items` (`ContainerId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE UNIQUE INDEX `IX_repositioning_request_items_RepositioningRequestId_Container~` ON `repositioning_request_items` (`RepositioningRequestId`, `ContainerId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE INDEX `IX_repositioning_requests_DestinationTerminalId` ON `repositioning_requests` (`DestinationTerminalId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE INDEX `IX_repositioning_requests_RequestedById` ON `repositioning_requests` (`RequestedById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE UNIQUE INDEX `IX_repositioning_requests_RequestNumber` ON `repositioning_requests` (`RequestNumber`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE INDEX `IX_repositioning_requests_ReviewedById` ON `repositioning_requests` (`ReviewedById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE INDEX `IX_repositioning_requests_ShippingLineId` ON `repositioning_requests` (`ShippingLineId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE INDEX `IX_repositioning_requests_SourceTerminalId` ON `repositioning_requests` (`SourceTerminalId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE INDEX `IX_suspension_appeals_ReviewedById` ON `suspension_appeals` (`ReviewedById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE INDEX `IX_suspension_appeals_UserId` ON `suspension_appeals` (`UserId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    CREATE INDEX `IX_welcome_contents_Audience_IsActive` ON `welcome_contents` (`Audience`, `IsActive`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806040637_Phase5OpsSatellite') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260806040637_Phase5OpsSatellite', '7.0.20');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806041746_Phase6Platform') THEN

    CREATE TABLE `document_templates` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `DocumentType` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `Name` varchar(120) CHARACTER SET utf8mb4 NOT NULL,
        `Version` int NOT NULL,
        `BodyHtml` longtext CHARACTER SET utf8mb4 NOT NULL,
        `IsActive` tinyint(1) NOT NULL,
        `UpdatedById` char(36) COLLATE ascii_general_ci NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_document_templates` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_document_templates_users_UpdatedById` FOREIGN KEY (`UpdatedById`) REFERENCES `users` (`Id`) ON DELETE SET NULL
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806041746_Phase6Platform') THEN

    CREATE TABLE `message_templates` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `Key` varchar(80) CHARACTER SET utf8mb4 NOT NULL,
        `Channel` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `Name` varchar(120) CHARACTER SET utf8mb4 NOT NULL,
        `Subject` varchar(200) CHARACTER SET utf8mb4 NULL,
        `Body` longtext CHARACTER SET utf8mb4 NOT NULL,
        `IsActive` tinyint(1) NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_message_templates` PRIMARY KEY (`Id`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806041746_Phase6Platform') THEN

    CREATE TABLE `notification_deliveries` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `UserId` char(36) COLLATE ascii_general_ci NULL,
        `Channel` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `Category` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
        `Title` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
        `Status` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
        `Error` varchar(1000) CHARACTER SET utf8mb4 NULL,
        `NotificationId` char(36) COLLATE ascii_general_ci NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_notification_deliveries` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_notification_deliveries_users_UserId` FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`) ON DELETE SET NULL
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806041746_Phase6Platform') THEN

    CREATE TABLE `notification_preferences` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
        `InAppEnabled` tinyint(1) NOT NULL,
        `EmailEnabled` tinyint(1) NOT NULL,
        `SmsEnabled` tinyint(1) NOT NULL,
        `PushEnabled` tinyint(1) NOT NULL,
        `MutedCategoriesJson` longtext CHARACTER SET utf8mb4 NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_notification_preferences` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_notification_preferences_users_UserId` FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806041746_Phase6Platform') THEN

    CREATE TABLE `push_subscriptions` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
        `Endpoint` varchar(1000) CHARACTER SET utf8mb4 NOT NULL,
        `P256dh` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
        `Auth` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
        `UserAgent` varchar(300) CHARACTER SET utf8mb4 NULL,
        `LastUsedAt` datetime(6) NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_push_subscriptions` PRIMARY KEY (`Id`),
        CONSTRAINT `FK_push_subscriptions_users_UserId` FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`) ON DELETE CASCADE
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806041746_Phase6Platform') THEN

    CREATE TABLE `rate_limit_rules` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `Name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
        `PathPrefix` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
        `Role` varchar(40) CHARACTER SET utf8mb4 NULL,
        `PermitLimit` int NOT NULL,
        `WindowSeconds` int NOT NULL,
        `IsActive` tinyint(1) NOT NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_rate_limit_rules` PRIMARY KEY (`Id`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806041746_Phase6Platform') THEN

    CREATE TABLE `scheduled_reports` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `ReportType` varchar(60) CHARACTER SET utf8mb4 NOT NULL,
        `CronExpression` varchar(80) CHARACTER SET utf8mb4 NOT NULL,
        `RecipientsJson` longtext CHARACTER SET utf8mb4 NOT NULL,
        `IsActive` tinyint(1) NOT NULL,
        `LastRunAt` datetime(6) NULL,
        `LastResultPath` varchar(500) CHARACTER SET utf8mb4 NULL,
        `LastError` varchar(1000) CHARACTER SET utf8mb4 NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_scheduled_reports` PRIMARY KEY (`Id`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806041746_Phase6Platform') THEN

    CREATE TABLE `system_settings` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `Key` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
        `Value` varchar(2000) CHARACTER SET utf8mb4 NOT NULL,
        `Description` varchar(500) CHARACTER SET utf8mb4 NULL,
        `CreatedAt` datetime(6) NOT NULL,
        `UpdatedAt` datetime(6) NULL,
        CONSTRAINT `PK_system_settings` PRIMARY KEY (`Id`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806041746_Phase6Platform') THEN

    CREATE INDEX `IX_document_templates_DocumentType_Version` ON `document_templates` (`DocumentType`, `Version`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806041746_Phase6Platform') THEN

    CREATE INDEX `IX_document_templates_UpdatedById` ON `document_templates` (`UpdatedById`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806041746_Phase6Platform') THEN

    CREATE UNIQUE INDEX `IX_message_templates_Key_Channel` ON `message_templates` (`Key`, `Channel`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806041746_Phase6Platform') THEN

    CREATE INDEX `IX_notification_deliveries_UserId` ON `notification_deliveries` (`UserId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806041746_Phase6Platform') THEN

    CREATE UNIQUE INDEX `IX_notification_preferences_UserId` ON `notification_preferences` (`UserId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806041746_Phase6Platform') THEN

    CREATE UNIQUE INDEX `IX_push_subscriptions_Endpoint` ON `push_subscriptions` (`Endpoint`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806041746_Phase6Platform') THEN

    CREATE INDEX `IX_push_subscriptions_UserId` ON `push_subscriptions` (`UserId`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806041746_Phase6Platform') THEN

    CREATE UNIQUE INDEX `IX_system_settings_Key` ON `system_settings` (`Key`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806041746_Phase6Platform') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260806041746_Phase6Platform', '7.0.20');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806043025_Phase7Hardening') THEN

    CREATE INDEX `IX_rate_limit_rules_IsActive_PathPrefix` ON `rate_limit_rules` (`IsActive`, `PathPrefix`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806043025_Phase7Hardening') THEN

    CREATE INDEX `IX_pre_advice_requests_Status` ON `pre_advice_requests` (`Status`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806043025_Phase7Hardening') THEN

    CREATE INDEX `IX_payments_ManifestId_Status` ON `payments` (`ManifestId`, `Status`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806043025_Phase7Hardening') THEN

    CREATE INDEX `IX_payments_Status` ON `payments` (`Status`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806043025_Phase7Hardening') THEN

    CREATE INDEX `IX_manifests_ShippingLineId_WorkflowState` ON `manifests` (`ShippingLineId`, `WorkflowState`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806043025_Phase7Hardening') THEN

    CREATE INDEX `IX_manifests_WorkflowState` ON `manifests` (`WorkflowState`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806043025_Phase7Hardening') THEN

    CREATE INDEX `IX_electronic_delivery_orders_Status` ON `electronic_delivery_orders` (`Status`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806043025_Phase7Hardening') THEN

    CREATE INDEX `IX_electronic_delivery_orders_Status_ReleasedAt` ON `electronic_delivery_orders` (`Status`, `ReleasedAt`);

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260806043025_Phase7Hardening') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260806043025_Phase7Hardening', '7.0.20');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

