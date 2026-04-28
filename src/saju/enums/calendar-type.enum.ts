export enum CalendarType {
    SOLAR = 'Solar',
    LUNAR = 'Lunar',
}

export const CalendarTypeDescription: { [key in CalendarType]: string } = {
    [CalendarType.SOLAR]: '양력',
    [CalendarType.LUNAR]: '음력',
};
