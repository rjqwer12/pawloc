import copy from '@iconify-icons/lucide/copy';
import circle from '@iconify-icons/lucide/circle';
import { Icon } from '@iconify/react';
import icon0 from '@iconify-icons/lucide/chart-no-axes-combined';
import icon1 from '@iconify-icons/lucide/check';
import icon2 from '@iconify-icons/lucide/clock';
import icon3 from '@iconify-icons/lucide/square-pen';
import icon4 from '@iconify-icons/lucide/user-round';
import icon5 from '@iconify-icons/lucide/trash-2';
import icon6 from '@iconify-icons/lucide/calendar-days';
import icon7 from '@iconify-icons/lucide/camera';
import icon8 from '@iconify-icons/lucide/x';
import icon9 from '@iconify-icons/lucide/megaphone';
import icon10 from '@iconify-icons/lucide/search';
import icon11 from '@iconify-icons/lucide/compass';
import icon12 from '@iconify-icons/lucide/party-popper';
import icon13 from '@iconify-icons/lucide/triangle-alert';
import icon14 from '@iconify-icons/lucide/layout-grid';
import icon15 from '@iconify-icons/lucide/map';
import icon16 from '@iconify-icons/lucide/shield';
import icon17 from '@iconify-icons/lucide/paw-print';
import icon18 from '@iconify-icons/lucide/library';
import icon19 from '@iconify-icons/lucide/sliders-horizontal';
import icon20 from '@iconify-icons/lucide/log-out';
import icon21 from '@iconify-icons/lucide/bell';
import icon22 from '@iconify-icons/lucide/circle-plus';
import icon23 from '@iconify-icons/lucide/heart';
import icon24 from '@iconify-icons/lucide/message-square';
import icon25 from '@iconify-icons/lucide/map-pin';
import icon26 from '@iconify-icons/lucide/flag';
import icon27 from '@iconify-icons/lucide/phone';
import icon28 from '@iconify-icons/lucide/building-2';
import icon29 from '@iconify-icons/lucide/eye';
import icon30 from '@iconify-icons/lucide/eye-off';
import icon31 from '@iconify-icons/lucide/upload';
import icon32 from '@iconify-icons/lucide/file-text';

const icons = {
  copy,
  circle,
  'activity': icon0,
  'check': icon1,
  'clock': icon2,
  'edit': icon3,
  'profile': icon4,
  'delete': icon5,
  'calendar': icon6,
  'camera': icon7,
  'close': icon8,
  'megaphone': icon9,
  'search': icon10,
  'compass': icon11,
  'celebrate': icon12,
  'warning': icon13,
  'home': icon14,
  'map': icon15,
  'shelter': icon16,
  'paw': icon17,
  'library': icon18,
  'settings': icon19,
  'logout': icon20,
  'bell': icon21,
  'plus': icon22,
  'heart': icon23,
  'comment': icon24,
  'pin': icon25,
  'flag': icon26,
  'phone': icon27,
  'building': icon28,
  'eye': icon29,
  'eye-off': icon30,
  'upload': icon31,
  'file': icon32,
};

export default function UserIcon({ name, ...props }) {
  return <Icon icon={icons[name] || icons.paw} width="24" height="24" aria-hidden="true" {...props} />;
}
