import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    sets: [{
        weight: Number,
        reps: Number,
        completed: {
            type: Boolean,
            default: false,
        },
    }],
    notes: String,
    completed: {
        type: Boolean,
        default: false,
    },
});

const workoutSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    scheduledDate: {
        type: Date,
        required: true,
    },
    scheduledTime: {
        type: String,
        required: true
    },
    exercises: [exerciseSchema],
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'cancelled'],
        default: "pending",
    },
    comments: [{
        text: String,
        createdAt: {
            type: Date,
            default: Date.now,
        },
    }],
    completionRate: {
        type: Number,
        default: 0
    },
    duration: Number, // Total durasi workout dalam menit
    notes: String,
}, {
    timestamps: true,
});

// Middleware untuk menghitung completion rate
workoutSchema.pre("save", function(next) {
    if (this.exercises.length > 0) {
        const completedExercises = this.exercises.filter(exercise => exercise.completed).length;
        this.completionRate = (completedExercises / this.exercises.length) * 100;
    };
    this.updatedAt = new Date();
    next();
});

const Workout = mongoose.model("Workout", workoutSchema);

export default Workout;