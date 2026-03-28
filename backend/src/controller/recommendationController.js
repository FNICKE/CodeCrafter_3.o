const { getRecommendations } = require("../services/recommendationService");

const getSmartRecommendations = async (req, res) => {
  try {
    const { budget } = req.body;

    if (!budget || budget < 1000) {
      return res.status(400).json({ 
        error: "Please enter a valid budget (minimum ₹1000)" 
      });
    }

    const recommendations = await getRecommendations(Number(budget));

    res.json({ 
      recommendations,
      message: null 
    });

  } catch (err) {
    console.error("Recommendation error:", err);
    res.status(500).json({ 
      error: "Failed to generate recommendations. Please try again." 
    });
  }
};

module.exports = { getSmartRecommendations };
