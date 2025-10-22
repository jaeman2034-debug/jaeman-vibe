import type { Parsed } from "@/lib/nlu/parseSignup";declare global {  interface Window {    __setSignupFields?: (p: Parsed) => void;  }}export {}; 
