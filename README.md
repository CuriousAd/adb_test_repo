# Adbrew TODO App

A full-stack TODO application built with React, Django, and MongoDB, running inside Docker containers.

## Setup

1. Clone and cd into the repository.

2. Set the environment variable pointing to the `src` directory:
```
export ADBREW_CODEBASE_PATH="/path/to/repo/src"
```

3. Build the containers (first time only):
```
docker-compose build
```

4. Start everything:
```
docker-compose up -d
```

5. Verify all 3 containers are running:
```
docker ps
```

6. Open http://localhost:3000 for the React app and http://localhost:8000/todos/ for the API.

The `app` container takes a while on first boot because `yarn install` runs inside it.

## What I Changed and Why

### Docker Fixes

The original Dockerfile tried to install MongoDB 4.4 via apt into a Debian Bookworm image, which doesn't work because Bookworm ships `libssl3` and Mongo 4.4 needs `libssl1.1`. I removed the in-image MongoDB installation entirely and switched `docker-compose.yml` to use the official `mongo:4.4` Docker image instead -- this is the cleaner approach anyway since each container should run a single process.

The original Dockerfile also used `easy_install` to install pip, but `easy_install` has been removed from recent Python distributions. Since `python:3.8` already ships with pip, this line was unnecessary.

For Node.js, the original setup pulled whatever version Debian's apt had (Node 18 on Bookworm). `react-scripts@4.0.1` has compatibility issues with Node 18, so I pinned Node.js 16 by downloading the binary directly. Yarn is installed via npm instead of through apt.

I also removed the deprecated `version: '2'` key from `docker-compose.yml` and replaced `links` with `depends_on`, which is the modern equivalent.

### Backend (views.py)

The original `views.py` had stub methods that returned empty responses. I implemented the actual GET and POST handlers.

I structured the backend using a service layer pattern -- there's a `TodoService` class that handles all MongoDB operations, and the `TodoListView` class handles HTTP concerns only. This separation means the database logic is isolated from the request/response handling, which makes it easier to test, modify, or swap out the storage layer without touching the view code.

The `TodoService` class uses pymongo directly (no Django ORM or serializers, as specified in the instructions). Each todo gets a `title` and a `created_at` timestamp on creation. The `get_all` method sorts by creation date in descending order so the newest todos appear first. MongoDB's `ObjectId` isn't JSON-serializable, so it gets converted to a string before returning.

Input validation rejects empty or whitespace-only titles with a 400 response. Database errors are caught, logged, and returned as 500 responses so the client gets a clean error message instead of a traceback.

### Frontend (App.js, api.js)

I rewrote `App.js` to use React hooks as required -- `useState` for the todo list, input field, loading state, and error state; `useEffect` to fetch todos on mount; and `useCallback` to memoize the fetch function so it doesn't get recreated on every render.

The API calls are extracted into a separate `api.js` module. This keeps the component focused on rendering and state management, and puts all the fetch logic and URL configuration in one place. If the API base URL changes, there's only one spot to update.

The flow is: component mounts -> fetches todos from the API -> renders the list. When the form is submitted, it POSTs to the API, clears the input, and re-fetches the full list to stay in sync with the database. Error states are shown to the user and cleared on the next successful operation.

## Project Structure

```
Dockerfile              - Shared image for api and app containers
docker-compose.yml      - Defines api, app, and mongo services
src/
  app/src/
    App.js              - Main React component (hooks-based)
    App.css             - Styles
    api.js              - API service module (fetchTodos, createTodo)
  rest/rest/
    views.py            - Django views + TodoService (pymongo)
    urls.py             - URL routing
    settings.py         - Django config (CORS, DRF)
  requirements.txt      - Python dependencies
```
