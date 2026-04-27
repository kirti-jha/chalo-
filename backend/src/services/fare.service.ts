export class FareService {
  private static BASE_FARE = 20; // Base fare in currency
  private static RATE_PER_KM = 10; // Rate per kilometer

  static calculateFare(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    const fare = this.BASE_FARE + (distance * this.RATE_PER_KM);
    return Math.round(fare);
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
