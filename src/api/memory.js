import request from "@/api/index"

export function getMemoryListAPI({ userId, kind, query } = {}) {
  return request({
    url: "memory",
    method: "GET",
    params: {
      user_id: userId,
      kind,
      query,
    },
  })
}

export function createMemoryAPI(memory) {
  return request({
    url: "memory",
    method: "POST",
    data: memory,
  })
}

export function updateMemoryAPI(kind, memoryId, memory) {
  return request({
    url: `memory/${kind}/${memoryId}`,
    method: "PUT",
    data: memory,
  })
}

export function deleteMemoryAPI(kind, memoryId, userId) {
  return request({
    url: `memory/${kind}/${memoryId}`,
    method: "DELETE",
    params: {
      user_id: userId,
    },
  })
}
