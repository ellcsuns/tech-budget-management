declare module 'react-icons' {
  import { ComponentType, SVGAttributes } from 'react';
  export type IconType = ComponentType<SVGAttributes<SVGElement> & { size?: number | string }>;
}

declare module 'react-icons/hi2' {
  import { IconType } from 'react-icons';
  export const HiOutlineChartBarSquare: IconType;
  export const HiOutlineBanknotes: IconType;
  export const HiOutlineCurrencyDollar: IconType;
  export const HiOutlineCalendarDays: IconType;
  export const HiOutlineDocumentText: IconType;
  export const HiOutlineChartBar: IconType;
  export const HiOutlineLockClosed: IconType;
  export const HiOutlineCheckCircle: IconType;
  export const HiOutlineDocumentChartBar: IconType;
  export const HiOutlineCog6Tooth: IconType;
  export const HiOutlineCircleStack: IconType;
  export const HiOutlineUserGroup: IconType;
  export const HiOutlineShieldCheck: IconType;
  export const HiOutlineArrowRightOnRectangle: IconType;
  export const HiOutlineScale: IconType;
  export const HiOutlineTableCells: IconType;
  export const HiOutlineLanguage: IconType;
}
