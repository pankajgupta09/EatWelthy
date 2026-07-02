const router = require("express").Router();
const Event = require("../models/Event");
const User = require("../models/User");
const auth = require("../middlewares/auth");
const { google } = require("googleapis");

// Attempt to sync an event to the user's Google Calendar if they have tokens
async function syncToGoogleCalendar(user, event) {
  if (!user.googleAccessToken) return null;

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    // Auto-refresh the access token if expired
    oauth2Client.on("tokens", async (tokens) => {
      if (tokens.access_token) {
        user.googleAccessToken = tokens.access_token;
        await user.save();
      }
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const calendarEvent = {
      summary: event.title,
      description: event.describe || "",
      start: {
        dateTime: new Date(event.start).toISOString(),
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: new Date(event.end).toISOString(),
        timeZone: "Asia/Kolkata",
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: calendarEvent,
    });

    return response.data.id;
  } catch (error) {
    console.error("Google Calendar sync failed:", error.message);
    return null; // Non-fatal — event is still saved locally
  }
}

// POST /events — create a new event
router.post("/", auth, async (req, res) => {
  try {
    const hashedUserId = Event.hashedUserId(req.user.id);
    const newEvent = new Event({ ...req.body, userId: hashedUserId });
    const savedEvent = await newEvent.save();

    // Attempt Google Calendar sync (non-blocking)
    const user = await User.findById(req.user.id);
    const googleEventId = await syncToGoogleCalendar(user, savedEvent);

    return res.status(200).json({
      success: true,
      data: savedEvent,
      message: "Event added",
      googleCalendarEventId: googleEventId || null,
    });
  } catch (err) {
    console.error("Error creating event:", err.message);
    return res.status(400).json({ success: false, error: "Failed to create event" });
  }
});

// GET /events — get all events for the authenticated user
router.get("/", auth, async (req, res) => {
  try {
    const hashedUserId = Event.hashedUserId(req.user.id);
    const events = await Event.find({ userId: hashedUserId });
    res.status(200).json(events);
  } catch (err) {
    console.error("Error fetching events:", err.message);
    return res.status(400).json({ success: false, error: "Failed to fetch events" });
  }
});

// GET /events/:id/show — get a single event
router.get("/:id/show", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    res.status(200).json(event);
  } catch (err) {
    console.error("Error fetching event:", err.message);
    return res.status(400).json({ success: false, message: "Event not found" });
  }
});

// PUT /events/:id/update — update an event
router.put("/:id/update", auth, async (req, res) => {
  try {
    const { title, start, end, describe } = req.body;

    const result = await Event.findOneAndUpdate(
      { _id: req.params.id },
      { title, start, end, describe },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    return res.status(200).json({ success: true, data: result, message: "Event updated" });
  } catch (err) {
    console.error("Error updating event:", err.message);
    return res.status(400).json({ success: false, message: "Event not updated" });
  }
});

// DELETE /events/:id/delete — delete an event
router.delete("/:id/delete", auth, async (req, res) => {
  try {
    const result = await Event.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    res.status(200).json({ success: true, message: "Event deleted" });
  } catch (err) {
    console.error("Error deleting event:", err.message);
    res.status(400).json({ success: false, message: "Failed to delete event" });
  }
});

module.exports = router;
