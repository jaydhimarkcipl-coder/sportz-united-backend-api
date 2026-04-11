const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/user/auth.routes');
const arenaRoutes = require('./routes/user/arena.routes');
const courtRoutes = require('./routes/user/court.routes');
const bookingRoutes = require('./routes/user/booking.routes');
const paymentRoutes = require('./routes/user/payment.routes');
const userRoutes = require('./routes/user/user.routes');
const adminAuthRoutes = require('./routes/admin/auth.routes');
const adminBookingRoutes = require('./routes/admin/booking.routes');
const superArenaRoutes = require('./routes/super-admin/arena.routes');
const adminCourtRoutes = require('./routes/admin/court.routes');
const adminSlotRoutes = require('./routes/admin/slot.routes');
const adminPricingRoutes = require('./routes/admin/pricing.routes');
const adminWalletRoutes = require('./routes/admin/wallet.routes');
const adminPromoRoutes = require('./routes/admin/promo.routes');
const adminMemRoutes = require('./routes/admin/membership.routes');
const adminReportRoutes = require('./routes/admin/report.routes');
const adminStaffRoutes = require('./routes/admin/staff.routes');
const adminNotifRoutes = require('./routes/admin/notification.routes');
const superSportRoutes = require('./routes/super-admin/sport.routes');
const superUserRoutes = require('./routes/super-admin/user.routes');
const sportRoutes = require('./routes/user/sport.routes');
const superAmenityRoutes = require('./routes/super-admin/amenity.routes');
const adminArenaAmenityRoutes = require('./routes/admin/arena-amenity.routes');
const publicAmenityRoutes = require('./routes/user/amenity.routes');
const superBookingRoutes = require('./routes/super-admin/booking.routes');
const publicNotificationRoutes = require('./routes/user/notification.routes');

// Import error handler
const errorHandler = require('./middlewares/error.middleware');

// Import Swagger
const { swaggerUi, specs } = require('./config/swagger');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Main Routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use('/api/auth', authRoutes); // Legacy Player Auth
app.use('/api/admin/auth', adminAuthRoutes); // New Admin Auth
app.use('/api/admin/bookings', adminBookingRoutes); // Admin Dashboard module
app.use('/api/super-admin/arenas', superArenaRoutes); // Super Admin Arenas
app.use('/api/admin/courts', adminCourtRoutes); // Admin Courts module
app.use('/api/admin/slots', adminSlotRoutes); // Admin Slots module
app.use('/api/admin/pricing', adminPricingRoutes); // Admin Pricing module
app.use('/api/admin', adminWalletRoutes); // Admin Wallet & Transactions
app.use('/api/admin/promos', adminPromoRoutes); // Admin Promos module
app.use('/api/admin/memberships', adminMemRoutes); // Admin Memberships module
app.use('/api/admin/reports', adminReportRoutes); // Admin Reports module
app.use('/api/admin/staff', adminStaffRoutes); // Admin Staff module
app.use('/api/admin/notifications', adminNotifRoutes); // Admin Notifications module
app.use('/api/super-admin/sports', superSportRoutes); // Super Admin Sports
app.use('/api/super-admin/users', superUserRoutes);   // Super Admin Users
app.use('/api/sports', sportRoutes); // Public Sports List
app.use('/api/arenas', arenaRoutes);
app.use('/api/courts', courtRoutes); // Using courtRoutes for slot fetching
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/super-admin/amenities', superAmenityRoutes);
app.use('/api/super-admin/bookings', superBookingRoutes);
app.use('/api/admin/arenas', adminArenaAmenityRoutes);
app.use('/api/amenities', publicAmenityRoutes);
app.use('/api/notifications', publicNotificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'UP', message: 'Sportz United Backend is running!' });
});

// Centralized Error Handling
app.use(errorHandler);

module.exports = app;
