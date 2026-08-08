export type LinkedPartyDto = {
  id: string;
  name: string;
  email: string;
};

export type ShippingAdminConsigneeDto = {
  id: string;
  businessName: string;
  fullName: string;
  email: string;
  status: string;
  isActive: boolean;
  brokerCount: number;
  noaCount: number;
  manifestCount: number;
  containerCount: number;
  linkedBrokers: LinkedPartyDto[];
};

export type ShippingAdminBrokerDto = {
  id: string;
  fullName: string;
  email: string;
  status: string;
  isActive: boolean;
  consigneeCount: number;
  manifestCount: number;
  edoCount: number;
  linkedConsignees: LinkedPartyDto[];
};

export type RecentManifestDto = {
  id: string;
  manifestNumber: string;
  workflowState: string;
  createdAt: string;
};

export type PartnerNoaListItemDto = {
  id: string;
  noaNumber: string;
  manifestId: string;
  manifestNumber: string;
  vesselName?: string | null;
  eta?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type PartnerManifestListItemDto = {
  id: string;
  manifestNumber: string;
  workflowState: string;
  noaNumber?: string | null;
  blNumber?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  edoTotalCount: number;
  edoReleasedCount: number;
};

export type PartnerContainerListItemDto = {
  id: string;
  containerNumber: string;
  manifestId?: string | null;
  manifestNumber?: string | null;
  typeCode?: string | null;
  sizeCode?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
};

export type PartnerEdoListItemDto = {
  id: string;
  edoNumber: string;
  manifestId: string;
  manifestNumber: string;
  containerNumber?: string | null;
  status: string;
  generatedAt: string;
  updatedAt?: string | null;
};

export type PartnerAccreditationDto = {
  id: string;
  formConfigurationId: string;
  formName: string;
  formType: string;
  formVersion: number;
  fieldsJson: string;
  submittedDataJson: string;
  status: string;
  submittedAt: string;
  approvedAt?: string | null;
  evaluatedAt?: string | null;
  sasIdNumber?: string | null;
  certificatePdfPath?: string | null;
};

export type ShippingAdminConsigneeDetailDto = {
  consignee: ShippingAdminConsigneeDto;
  edoCount: number;
  noas: PartnerNoaListItemDto[];
  manifests: PartnerManifestListItemDto[];
  containers: PartnerContainerListItemDto[];
  edos: PartnerEdoListItemDto[];
  accreditation?: PartnerAccreditationDto | null;
};

export type ShippingAdminBrokerDetailDto = {
  broker: ShippingAdminBrokerDto;
  containerCount: number;
  manifests: PartnerManifestListItemDto[];
  containers: PartnerContainerListItemDto[];
  edos: PartnerEdoListItemDto[];
  accreditation?: PartnerAccreditationDto | null;
};
