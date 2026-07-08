from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging
import os
from pymongo import MongoClient
from datetime import datetime

logger = logging.getLogger(__name__)

mongo_uri = 'mongodb://' + os.environ["MONGO_HOST"] + ':' + os.environ["MONGO_PORT"]
db = MongoClient(mongo_uri)['test_db']


class TodoService:
    """Service layer to keep DB logic separate from view logic."""

    def __init__(self, collection):
        self.collection = collection

    def get_all(self):
        todos = list(self.collection.find().sort("created_at", -1))
        # ObjectId isn't JSON serializable, convert to str
        for todo in todos:
            todo['_id'] = str(todo['_id'])
        return todos

    def create(self, title):
        todo = {
            "title": title,
            "created_at": datetime.utcnow().isoformat(),
        }
        result = self.collection.insert_one(todo)
        todo['_id'] = str(result.inserted_id)
        return todo


todo_service = TodoService(db.todos)


class TodoListView(APIView):

    def get(self, request):
        try:
            todos = todo_service.get_all()
            return Response(todos, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Failed to fetch todos: {e}")
            return Response(
                {"error": "Failed to fetch todos"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request):
        title = request.data.get("title", "").strip()

        if not title:
            return Response(
                {"error": "Title is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            todo = todo_service.create(title)
            return Response(todo, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Failed to create todo: {e}")
            return Response(
                {"error": "Failed to create todo"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
