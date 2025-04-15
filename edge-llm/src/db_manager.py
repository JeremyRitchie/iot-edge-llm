import os
from tinydb import TinyDB, Query, table

db_path = "/tmp/edge_llm_db.json"
# initialize a TINY DB instance
db = TinyDB(db_path)
print(f"DB location initiated at -> {db_path}")



def query_executor(payload: dict):
    try:
        if "add" == payload["opr"] and payload["data"] is not None:
            # returns id
            return db.insert(table.Document(payload["data"], doc_id=payload["data"]["id"]))
        elif "chats" == payload["opr"] and payload["type"] is not None:
            print(f"retrieving all chats")
            data = Query()
            return db.search(data.type == payload["type"])
        elif "clear_chats" == payload["opr"] and payload["type"] is not None:
            print(f"clear all chats")
            query_builder = Query()
            results = db.remove(query_builder.type == "chat")
            print(results)
            return "success"
    except Exception as e:
        print(e)
        return error_response()


def get_chat_history():
    try:
        data = Query()
        return db.search(data.type == "chat")
    except Exception as e:
        print(e)
        return error_response()


def update_chat_by_id(id: int, chat_update: dict):
    try:
        db.upsert(table.Document(
            {'metrics': chat_update["metrics"], 'bot': chat_update["response"]}, doc_id=id))
        print(f"chat updated for id : {id}")
    except Exception as e:
        print(e)
        return error_response()


def error_response(message="DB operations error"):
    return message
