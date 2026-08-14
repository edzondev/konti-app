import { withUniwind } from "uniwind";
import AddIcon from "reicon-react-native/icons/Add";
import ArrowDownIcon from "reicon-react-native/icons/ArrowDown";
import ArrowRightIcon from "reicon-react-native/icons/ArrowRight";
import CalendarIcon from "reicon-react-native/icons/Calendar";
import CheckIcon from "reicon-react-native/icons/Check";
import HelpCircleIcon from "reicon-react-native/icons/HelpCircle";
import HomeIcon from "reicon-react-native/icons/Home";
import ReceiptIcon from "reicon-react-native/icons/Receipt";

/** Direct reicon imports wrapped once at module level for Uniwind colorClassName. */
export const Add = withUniwind(AddIcon);
export const ArrowDown = withUniwind(ArrowDownIcon);
export const ArrowRight = withUniwind(ArrowRightIcon);
export const Calendar = withUniwind(CalendarIcon);
export const Check = withUniwind(CheckIcon);
export const HelpCircle = withUniwind(HelpCircleIcon);
export const Home = withUniwind(HomeIcon);
export const Receipt = withUniwind(ReceiptIcon);
