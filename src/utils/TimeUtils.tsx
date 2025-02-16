export const getLocalTimeDetails = (init_h: string, time: number): { hour: string, date: number, weekday: string } => {
    const offsetHours = -(new Date().getTimezoneOffset()) / 60;
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const totalHours = parseInt(init_h) + time + offsetHours;
    const daysToAdd = Math.floor(totalHours / 24);

    let localHour = totalHours % 24;
    if (localHour < 0) localHour += 24;

    let adjustedDay = currentDay + daysToAdd;
    let adjustedMonth = currentMonth;
    let adjustedYear = currentYear;

    while (true) {
        const lastDayOfMonth = new Date(adjustedYear, adjustedMonth, 0).getDate();
        if (adjustedDay > lastDayOfMonth) {
            adjustedDay -= lastDayOfMonth;
            adjustedMonth += 1;
            if (adjustedMonth > 12) {
                adjustedMonth = 1;
                adjustedYear += 1;
            }
        } else {
            break;
        }
    }

    while (adjustedDay < 1) {
        adjustedMonth -= 1;
        if (adjustedMonth < 1) {
            adjustedMonth = 12;
            adjustedYear -= 1;
        }
        adjustedDay += new Date(adjustedYear, adjustedMonth, 0).getDate();
    }

    const weekday = new Date(adjustedYear, adjustedMonth - 1, adjustedDay).toLocaleString('en-US', { weekday: 'short' });

    return {
        hour: localHour.toString().padStart(2, "0") + 'h',
        date: adjustedDay,
        weekday: weekday
    };
};