export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'MOVED';
export type TaskType = 'ONE_TIME' | 'DAILY_RECURRING';
export type RecurrenceType = 'DAILY';
export type ReminderOption = 'NONE' | 'TEN_MINUTES' | 'THIRTY_MINUTES' | 'ONE_HOUR' | 'TWO_HOURS' | 'ONE_DAY' | 'CUSTOM';
export type NotificationType = 'TASK_REMINDER' | 'WEEKLY_REPORT' | 'MONTHLY_REPORT';
export type NotificationStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED' | 'CANCELLED';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface ErrorResponse {
  success: boolean;
  message: string;
  path: string;
  errors?: Record<string, string>;
  timestamp: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: number;
  name: string;
  email: string;
  timezone: string;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  timezone: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  timezone?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export type RepeatStopCondition = 'UNTIL_TASK_TIME' | 'AFTER_MAX_COUNT' | 'ON_COMPLETION';

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: Priority;
  taskType?: TaskType;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:mm:ss or HH:mm
  recurring?: boolean;
  recurrenceType?: RecurrenceType;
  reminderOption?: ReminderOption;
  customReminderMinutes?: number;
  repeatFrequencyMinutes?: number;
  repeatStopCondition?: RepeatStopCondition;
  maxReminderCount?: number;
  notifyByEmail?: boolean;
  notifyByPush?: boolean;
  timezone?: string;
}

export interface UpdateTaskRequest {
  title: string;
  description?: string;
  priority: Priority;
  dueDate?: string;
  dueTime: string;
  reminderOption?: ReminderOption;
  customReminderMinutes?: number;
  repeatFrequencyMinutes?: number;
  repeatStopCondition?: RepeatStopCondition;
  maxReminderCount?: number;
  notifyByEmail?: boolean;
  notifyByPush?: boolean;
}

export interface MoveTaskRequest {
  targetDate: string; // YYYY-MM-DD
}

export interface TaskResponse {
  id: number;
  taskDefinitionId: number;
  title: string;
  description?: string;
  priority: Priority;
  taskType: TaskType;
  recurrenceType?: RecurrenceType;
  dueDate: string;
  dueTime: string;
  dueDateTime: string;
  reminderOption: ReminderOption;
  customReminderMinutes?: number;
  repeatFrequencyMinutes?: number;
  repeatStopCondition?: RepeatStopCondition;
  maxReminderCount?: number;
  reminderSentCount?: number;
  notifyByEmail?: boolean;
  notifyByPush?: boolean;
  reminderScheduledAt?: string;
  status: TaskStatus;
  recurring: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'PENDING_CREATE' | 'PENDING_UPDATE' | 'PENDING_DELETE' | 'SYNCED';
}

export interface DashboardResponse {
  date: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  cancelledTasks: number;
  highPriorityPendingCount: number;
  mediumPriorityPendingCount: number;
  lowPriorityPendingCount: number;
  completionPercentage: number;
}

export interface AlertResponse {
  id: number;
  title: string;
  description?: string;
  priority: Priority;
  dueDate: string;
  dueTime: string;
  dueDateTime: string;
  minutesRemaining: number;
}

export interface DailyHistoryResponse {
  date: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  cancelledTasks: number;
  completionPercentage: number;
  tasks: TaskResponse[];
}

export interface RecurringTaskResponse {
  id: number;
  title: string;
  description?: string;
  priority: Priority;
  taskType: TaskType;
  recurrenceType: RecurrenceType;
  startDate: string;
  dueTime: string;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserEmailPreferenceResponse {
  id: number;
  userId: number;
  taskReminderEnabled: boolean;
  pushNotificationEnabled?: boolean;
  weeklyReportEnabled: boolean;
  monthlyReportEnabled: boolean;
  preferredWeeklyReportDay: string;
  preferredWeeklyReportTime: string;
  timezone: string;
  updatedAt: string;
}

export interface UserEmailPreferenceRequest {
  taskReminderEnabled?: boolean;
  pushNotificationEnabled?: boolean;
  weeklyReportEnabled?: boolean;
  monthlyReportEnabled?: boolean;
  preferredWeeklyReportDay?: string;
  preferredWeeklyReportTime?: string;
  timezone?: string;
}

export interface NotificationLogResponse {
  id: number;
  taskOccurrenceId?: number;
  notificationType: NotificationType;
  periodIdentifier?: string;
  scheduledFor: string;
  status: NotificationStatus;
  attemptCount: number;
  sentAt?: string;
  createdAt: string;
}

export interface WeeklyAnalyticsResponse {
  startDate: string;
  endDate: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  cancelledTasks: number;
  movedTasks: number;
  completionRate: number;
  highPriorityCompleted: number;
  highPriorityPending: number;
  mostProductiveDay: string;
  leastProductiveDay: string;
  previousWeekCompletionRate: number;
  completionRateDifference: number;
  comparisonMessage: string;
  dailyCompletedMap: Record<string, number>;
}

export interface MonthlyAnalyticsResponse {
  monthName: string;
  startDate: string;
  endDate: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  cancelledTasks: number;
  movedTasks: number;
  completionRate: number;
  highPriorityCompleted: number;
  highPriorityPending: number;
  mediumPriorityCompleted: number;
  mediumPriorityPending: number;
  lowPriorityCompleted: number;
  lowPriorityPending: number;
  mostProductiveDay: string;
  bestWeek: string;
  previousMonthCompletionRate: number;
  completionRateDifference: number;
  comparisonMessage: string;
  dailyCompletedMap: Record<string, number>;
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  size: number;
  number: number;
  numberOfElements: number;
  empty: boolean;
}
