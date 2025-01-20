import Workout from "../models/workout.model.js";


const getWorkoutReport = async (req, res) => {
    try {
        const userId = req.user.userId
        const {startDate, endDate} = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({message: "Start date and end date are required"});
        }

        if (isNaN(new Date(startDate).getTime()) || isNaN(new Date(endDate).getTime())) {
            return res.status(400).json({message: "Invalid date format for start date or end date"})
        }

        if (startDate > endDate) {
            return res.status(400).json({message: "Start date cannot be later than end date"})
        }

        const query = {
            user: userId,
            scheduledDate: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            },
        };

        const workout = await Workout.find(query);

        const totalWorkouts = workout.length;
        const completedWorkouts = workout.filter(workout => workout.status === "completed").length;
        const completionRate = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;

        const report = {
            period: {
                startDate,
                endDate,
            },
            totalWorkouts,
            completedWorkouts,
            completionRate: completionRate.toFixed(2),
            workouts: workout.map(workout => ({
                id: workout.id,
                title: workout.title,
                scheduledDate: workout.scheduledDate,
                status: workout.status,
                completionRate: workout.completionRate,
            })),
        };
        res.json(report);
    } catch (error) {
        console.log("Error getting workout report", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || "An unexpected error occurred",
        });
    };
};

export {getWorkoutReport};