export const config = {
    runtime: "edge",
};

export default (_: Request) => {
    return new Response(
        `Welcome to Steve's API. If you have no idea what are you doing, just let go.`,
    );
};
