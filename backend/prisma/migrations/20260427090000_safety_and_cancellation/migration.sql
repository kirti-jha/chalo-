ALTER TABLE "User"
ADD COLUMN "emergencyContactName" TEXT,
ADD COLUMN "emergencyContactPhone" TEXT;

ALTER TABLE "Driver"
ADD COLUMN "emergencyContactName" TEXT,
ADD COLUMN "emergencyContactPhone" TEXT;

ALTER TABLE "Ride"
ADD COLUMN "cancelledBy" TEXT,
ADD COLUMN "cancellationReason" TEXT,
ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "emergencyRaised" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "emergencyMessage" TEXT;

ALTER TABLE "SupportTicket"
ADD COLUMN "rideId" TEXT,
ADD COLUMN "ticketType" TEXT NOT NULL DEFAULT 'GENERAL',
ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'NORMAL',
ADD COLUMN "resolvedAt" TIMESTAMP(3);
