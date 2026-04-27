export class FareService {
    static BASE_FARE = 20; // Base fare in currency
    static RATE_PER_KM = 10; // Rate per kilometer
    static calculateFare(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in km
        const fare = this.BASE_FARE + (distance * this.RATE_PER_KM);
        return Math.round(fare);
    }
    static deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
}
