export const CONTAINER_PHOTO_CATEGORIES = [
  { value: 'Flooring', label: 'Flooring', field: 'photoFlooring' },
  { value: 'RightSideIn', label: 'Right side (in)', field: 'photoRightSideIn' },
  { value: 'LeftSideIn', label: 'Left side (in)', field: 'photoLeftSideIn' },
  { value: 'Back', label: 'Back', field: 'photoBack' },
  { value: 'Front', label: 'Front', field: 'photoFront' },
  { value: 'LeftSideOut', label: 'Left side (out)', field: 'photoLeftSideOut' },
  { value: 'RightSideOut', label: 'Right side (out)', field: 'photoRightSideOut' },
] as const;

export const OTHERS_PHOTO = { value: 'Others', label: 'Others (optional)', field: 'photoOthers' } as const;

export type ContainerPhotoField = (typeof CONTAINER_PHOTO_CATEGORIES)[number]['field'] | typeof OTHERS_PHOTO.field;
