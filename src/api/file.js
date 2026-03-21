import request from "@/api/index"

export function getConfigAPI(file_id) {
    return request({
        url: `file/config/${file_id}`,
        method: "GET"
    })
}