import App from './App';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AppSettings } from '../types/AppSettingsType';
import { me } from '../services/user';
import { ProfileType } from '../types/ProfileType';
import sortAndFilterFlows from '../utils/sortAndFilterFlows';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import LoadingPayflowEntryLogo from '../components/LoadingPayflowEntryLogo';

export default function AppWithProviders() {}
