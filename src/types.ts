export type Language = 'ar' | 'en' | 'fr';
export type ThemeMode = 'light' | 'dark';
export type ReligiousPreference = 'islam' | 'christianity' | 'muslim' | 'christian' | 'skip';
export type CurrencyType = 'EGP' | 'SAR' | 'AED' | 'USD' | 'EUR' | string;

export type AppView =
  | 'dashboard'
  | 'notes'
  | 'calculator'
  | 'expenses'
  | 'trips'
  | 'vehicles'
  | 'education'
  | 'food'
  | 'religious'
  | 'vault'
  | 'ai'
  | 'chat'
  | 'media'
  | 'settings';

export interface TickerPreferences {
  showTimeAndDate: boolean;
  showGold: boolean;
  showSilver: boolean;
  showZodiac: boolean;
  showEgyptianLeague: boolean;
  showCrypto: boolean;
  showCurrencies: boolean;
  showWeather: boolean;
  showCustomMessage: boolean;
  customMessage?: string;
  favoriteEgyptianTeam?: string;
  silverUnit?: '999' | '925' | 'ounce';
  goldUnit?: '24' | '21' | 'pound';
}

export interface VehiclePreferences {
  primaryVehicleName?: string;
  fuelType?: 'gasoline92' | 'gasoline95' | 'gas' | 'diesel' | 'electric';
  serviceIntervalKm?: number;
}

export interface BudgetPreferences {
  monthlyBudgetLimit?: number;
  alertThresholdPercent?: number;
  defaultPaymentMethod?: 'cash' | 'instapay' | 'vodafoneCash' | 'card';
}

export interface ReligiousDetails {
  reciter?: string;
  prayerCalculationMethod?: string;
  athkarReminderEnabled?: boolean;
}

export interface FoodPreferences {
  dietType?: 'balanced' | 'keto' | 'vegetarian' | 'lowCalorie';
  favoriteDish?: string;
  autoAddToShoppingList?: boolean;
}

export interface EducationPreferences {
  defaultGradeLevel?: string;
  homeworkAlerts?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl: string;
  country: string;
  city: string;
  gender?: 'male' | 'female';
  occupation?: string;
  currency: CurrencyType;
  language: Language;
  theme: ThemeMode;
  religiousPreference: ReligiousPreference;
  isOnboarded: boolean;
  pin?: string;
  pinCode?: string;
  biometricEnabled?: boolean;
  birthDate?: string;
  zodiacSign?: string;
  tickerPreferences?: TickerPreferences;
  vehiclePreferences?: VehiclePreferences;
  budgetPreferences?: BudgetPreferences;
  religiousDetails?: ReligiousDetails;
  foodPreferences?: FoodPreferences;
  educationPreferences?: EducationPreferences;
}

// ---------------------------
// 1. NOTES & ACCOUNTING
// ---------------------------
export interface NoteFolder {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface NoteTag {
  id: string;
  name: string;
  color: string;
}

export interface Note {
  id: string;
  title: string;
  content: string; // Rich text HTML / Markdown
  folderId?: string;
  tags: string[];
  color: string;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  date?: string;
  images?: string[];
}

export type CalculatorMode = 'basic' | 'scientific' | 'engineering';

export interface CalculatorHistoryItem {
  id: string;
  expression: string;
  result: string;
  mode: CalculatorMode;
  timestamp: string;
}

// ---------------------------
// 2. EXPENSES & BUDGET
// ---------------------------
export type ExpenseCategoryType =
  | 'food'
  | 'transport'
  | 'vehicle'
  | 'education'
  | 'bills'
  | 'shopping'
  | 'health'
  | 'entertainment'
  | 'other';

export type ExpenseCategory = ExpenseCategoryType;

export type PaymentMethod = 'cash' | 'card' | 'wallet';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategoryType;
  date: string;
  paymentMethod: PaymentMethod;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
}

export type ExpenseItem = Expense;

export interface BudgetSummary {
  totalBudget: number;
  totalExpenses: number;
  remaining: number;
  percentUsed: number;
}

// ---------------------------
// 3. VEHICLES & FUEL
// ---------------------------
export interface Vehicle {
  id: string;
  name: string;
  model: string;
  year: number;
  plateNumber: string;
  fuelType: '92' | '95' | '80' | 'Diesel' | 'diesel' | 'Electric' | 'electric' | 'gas' | string;
  currentMileage: number;
  color?: string;
}

export interface FuelRecord {
  id: string;
  vehicleId: string;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  mileage: number;
  date: string;
  stationName?: string;
  notes?: string;
}

export type MaintenanceSystemType =
  | 'oil'
  | 'transmission'
  | 'tires'
  | 'brakes'
  | 'battery'
  | 'air_filter'
  | 'ac_filter'
  | 'spark_plugs'
  | 'coolant'
  | 'inspection'
  | 'electrical'
  | 'exhaust'
  | 'bodywork'
  | 'periodic'
  | 'other';

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  systemType: MaintenanceSystemType;
  title: string;
  cost: number;
  currentMileage: number;
  nextMileageDue: number;
  date: string;
  serviceCenter?: string;
  notes?: string;
}

// ---------------------------
// 4. EDUCATION (التعليم)
// ---------------------------
export interface Student {
  id: string;
  name: string;
  grade: string;
  schoolName: string;
  avatar: string;
}

export interface LessonItem {
  id: string;
  studentId: string;
  subject: string;
  title: string;
  dayOfWeek: string;
  time: string;
  tutorName?: string;
  monthlyFee: number;
  isPaid: boolean;
}

export interface EducationExpense {
  id: string;
  studentId: string;
  title: string;
  amount: number;
  category: 'tuition' | 'lessons' | 'books' | 'supplies' | 'transport' | 'private_tutor' | 'activities';
  date: string;
  notes?: string;
}

// ---------------------------
// 5. FOOD & SHOPPING
// ---------------------------
export type RecipeCategory =
  | 'normal'
  | 'keto'
  | 'tayyibat'
  | 'sports'
  | 'weight_loss'
  | 'family'
  | 'fast'
  | 'desserts'
  | 'favorites'
  | string;

export type DietCategory = RecipeCategory;

export interface RecipeIngredient {
  name: string;
  amount: string;
  unit: string;
}

export interface Recipe {
  id: string;
  title: string;
  category: RecipeCategory;
  image: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  isFavorite: boolean;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  isCompleted: boolean;
  category: string;
  addedFromRecipeId?: string;
}

// ---------------------------
// 6. TRIPS & SMART TRANSPORT
// ---------------------------
export interface GeoPoint {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export type TripPoint = GeoPoint;

export type RideType = 'Economy' | 'Comfort' | 'Scooter' | 'Taxi' | 'Normal' | string;

export interface TransportProviderOption {
  providerId: string;
  providerName: string;
  logoUrl: string;
  vehicleType: string;
  estimatedFareMin: number;
  estimatedFareMax: number;
  currency: string;
  etaMinutes: number;
  driverRating: number;
  deepLink: string;
}

export interface TransportComparisonResult {
  distanceKm: number;
  estimatedDurationMins: number;
  bestValueId: string;
  cheapestId: string;
  fastestId: string;
  options: TransportProviderOption[];
}

export interface RecentTrip {
  id: string;
  from: TripPoint;
  to: TripPoint;
  date: string;
  provider: string;
  rideType: string;
  fare: number;
}

export interface FavoritePlace {
  id: string;
  title: string;
  type: 'home' | 'work' | 'family' | 'other';
  point: TripPoint;
}

// ---------------------------
// 7. SECURE VAULT
// ---------------------------
export type SecureCategory = 'password' | 'code' | 'phone' | 'document' | 'note' | 'photo' | 'video' | 'file' | 'bank_card';

export interface SecureRecord {
  id: string;
  title: string;
  category: SecureCategory;
  value: string;
  username?: string;
  notes?: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: string;
  mimeType?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------
// 8. RELIGIOUS SECTION
// ---------------------------
export interface QuranSurah {
  number: number;
  name: string;
  englishName: string;
  versesCount: number;
  revelationType: 'Meccan' | 'Medinan';
}

export type QuranAyahTopicColor = 'green' | 'blue' | 'yellow' | 'purple' | 'red';

export interface QuranAyah {
  numberInSurah: number;
  surahNumber: number;
  surahName: string;
  text: string;
  tafsir?: string;
  juzNumber: number;
  topicColor: QuranAyahTopicColor;
  topicLabelAr: string;
  translationEn?: string;
}

export interface QuranReadingPosition {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  pageNumber: number;
  juzNumber: number;
  timestamp: string;
}

export interface QuranBookmark {
  id: string;
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  pageNumber: number;
  note?: string;
  createdAt: string;
}

export type AdhanType = 'full' | 'takbeer_only';

export interface MuadhinOption {
  id: string;
  nameAr: string;
  nameEn: string;
  location: string;
  audioSampleUrl?: string;
}

export interface QuranWirdProgress {
  currentPage: number;
  totalPages: number;
  dailyGoalPages: number;
  currentSurahName: string;
  reminderTime: string;
  reminderEnabled: boolean;
  streakDays: number;
  lastReadDate: string;
  lastPosition?: QuranReadingPosition;
}

export interface ChristianPrayer {
  id: string;
  title: string;
  hourName: string;
  text: string;
  description: string;
}

export interface ChristianDailyReading {
  date: string;
  saintOfDay: string;
  gospelText: string;
  gospelReference: string;
  epistleText: string;
  epistleReference: string;
  thoughtOfDay: string;
}

export interface AthkarCategory {
  id: string;
  title: string;
  icon: string;
  count: number;
}

export interface AthkarItem {
  id: string;
  categoryId: string;
  text: string;
  repeatCount: number;
  currentCount: number;
  virtue?: string;
}

export interface PrayerTimesData {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  currentPrayer: string;
  nextPrayer: string;
  timeRemaining: string;
}

// ---------------------------
// 9. AI CENTER
// ---------------------------
export type AiModelType = 'gemini-2.5-flash' | 'chatgpt-4o' | 'claude-3-5-sonnet' | 'manus-agent' | string;
export type AIProviderId = 'gemini' | 'chatgpt' | 'claude' | 'manus';

export interface AiMessage {
  id: string;
  sender: 'user' | 'ai' | 'model';
  text: string;
  timestamp: string;
  model?: AiModelType;
  provider?: AIProviderId;
  isCode?: boolean;
}

export type AIMessage = AiMessage;

// ---------------------------
// 10. HOT CHAT
// ---------------------------
export interface ChatRoom {
  id: string;
  title?: string;
  name?: string;
  type: 'public' | 'direct' | 'group';
  avatar: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline?: boolean;
}

export interface ChatMessage {
  id: string;
  roomId?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  mediaUrl?: string;
  type?: 'text' | 'image' | 'voice' | 'file';
  isOutgoing?: boolean;
  timestamp: string;
}

// ---------------------------
// 11. MEDIA & PDF / OCR
// ---------------------------
export interface MediaFolder {
  id: string;
  name: string;
  icon?: string;
  itemCount?: number;
}

export interface MediaItem {
  id: string;
  title?: string;
  name?: string;
  type: 'image' | 'video' | 'audio' | 'pdf' | 'document';
  url: string;
  fileSize?: string;
  sizeBytes?: number;
  date: string;
  folderId?: string;
  tags?: string[];
}

// ---------------------------
// 12. NOTIFICATIONS
// ---------------------------
export type NotificationCategory =
  | 'all'
  | 'chat'
  | 'trips'
  | 'expenses'
  | 'vehicles'
  | 'education'
  | 'food'
  | 'notes'
  | 'religious'
  | 'security'
  | 'backup'
  | 'system';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  category:
    | 'chat'
    | 'trips'
    | 'expenses'
    | 'vehicles'
    | 'education'
    | 'food'
    | 'notes'
    | 'religious'
    | 'backup'
    | 'security'
    | 'system';
  date: string;
  isRead: boolean;
  actionTab?: string;
}
