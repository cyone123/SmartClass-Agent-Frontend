import request from "@/api/index"
import axios from "axios"

export function getConfigAPI(file_id) {
    return request({
        url: `file/config/${file_id}`,
        method: 'GET'
    })
}

export function forceSaveAPI(key) {
    return axios({
        url: '/savefile/command',
        method: 'POST',
        data: {
            "c": "forcesave",
            "key": key
        }
    })
}
