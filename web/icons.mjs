import {
  createIcons, ArrowRight, ArrowUpRight, ArrowLeft, ShieldCheck, ShieldAlert,
  Globe2, Compass, Activity, LayoutDashboard, Wallet, KeyRound,
  Check, CheckCircle2, ChevronRight, ChevronLeft, ExternalLink,
  Copy, CircleHelp, Link2, Info, AlertTriangle, RefreshCw,
  Menu, X, Fingerprint, LockKeyhole, RadioTower, Code as Github, Server,
  Clock3, Eye, Plus, Settings2, FileCheck2, BookOpen, RotateCw,
  CheckCircle, Circle, Network, Search, ClipboardCheck, Database
} from 'lucide';
const icons = { ArrowRight, ArrowUpRight, ArrowLeft, ShieldCheck, ShieldAlert,
  Globe2, Compass, Activity, LayoutDashboard, Wallet, KeyRound,
  Check, CheckCircle2, ChevronRight, ChevronLeft, ExternalLink,
  Copy, CircleHelp, Link2, Info, AlertTriangle, RefreshCw,
  Menu, X, Fingerprint, LockKeyhole, RadioTower, Github, Server,
  Clock3, Eye, Plus, Settings2, FileCheck2, BookOpen, RotateCw,
  CheckCircle, Circle, Network, Search, ClipboardCheck, Database };
export function paintIcons(){
  createIcons({ icons, attrs: { 'stroke-width': 1.85, 'aria-hidden': 'true' } });
}
