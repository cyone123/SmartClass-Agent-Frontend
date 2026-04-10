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

export function getKnowledgeFileListAPI(plan_id) {
    return request({
        url: 'file/knowledgeFile',
        method: 'GET',
        params: {
            plan_id: plan_id
        }
    })
}

export function uploadKnowledgeFileAPI(plan_id, file) {
    const formData = new FormData()
    formData.append('file', file)
    
    return request({
        url: 'file/knowledgeFile/upload',
        method: 'POST',
        params: { plan_id: plan_id },
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
}

export function uploadAttachmentFileAPI(plan_id, thread_id, file) {
    const formData = new FormData()
    formData.append('file', file)

    return request({
        url: 'file/attachment/upload',
        method: 'POST',
        params: {
            plan_id: plan_id,
            thread_id: thread_id
        },
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
}

export function deleteKnowledgeFileAPI(file_id) {
    return request({
        url: `file/${file_id}`,
        method: 'DELETE'
    })
}
