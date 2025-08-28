export function getCurrentPosition(opts) { return new Promise((resolve, reject) => { if (!("geolocation" in navigator))
    return reject(new Error("Geolocation not supported")); navigator.geolocation.getCurrentPosition(resolve, reject, opts); }); }
