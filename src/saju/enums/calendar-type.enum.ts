export enum CalendarType {
    SOLAR = 'solar',
    LUNAR = 'lunar',
}

export const CalendarTypeDescription: { [key in CalendarType]: string } = {
    [CalendarType.SOLAR]: '양력',
    [CalendarType.LUNAR]: '음력',
};
