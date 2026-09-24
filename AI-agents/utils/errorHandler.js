function handleError(error) {

    console.error("ERROR:", error);


    // ========================
    // API KEY ERROR
    // ========================

    if (
        error.message?.includes("apiKeyInvalid") ||
        error.message?.includes("API key") ||
        error.message?.includes("Invalid API key")
    ) {

        return "API key is invalid. Please check the API configuration.";

    }


    // ========================
    // RATE LIMIT / QUOTA
    // ========================

    if (
        error.status === 429 ||
        error.code === "429" ||
        error.message?.includes("429") ||
        error.message?.toLowerCase().includes("quota")
    ) {

        return "API limit reached. Please try again later.";

    }


    // ========================
    // TIMEOUT
    // ========================

    if (
        error.code === "UND_ERR_CONNECT_TIMEOUT" ||
        error.code === "ETIMEDOUT" ||
        error.name === "TimeoutError"
    ) {

        return "The external service took too long to respond. Please try again.";

    }


    // ========================
    // NETWORK / FETCH ERROR
    // ========================

    if (
        error.name === "TypeError" &&
        error.message?.includes("fetch")
    ) {

        return "Unable to connect to the external service.";

    }


    // ========================
    // HTTP SERVER ERRORS
    // ========================

    if (error.status >= 500) {

        return "The external service is temporarily unavailable. Please try again later.";

    }


    // ========================
    // BAD REQUEST
    // ========================

    if (error.status === 400) {

        return "The request sent to the external service was invalid.";

    }


    // ========================
    // NOT FOUND
    // ========================

    if (error.status === 404) {

        return "The requested resource was not found.";

    }


    // ========================
    // DEFAULT ERROR
    // ========================

    return "Something went wrong. Please try again.";

}


export default handleError;