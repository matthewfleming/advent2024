export enum Direction {
  down = 'v',
  left = '<',
  right = '>',
  up = '^',
}

export function isVertical(d: Direction): d is Direction.down | Direction.up {
  return d === Direction.up || d === Direction.down
}

export function isHorizontal(d: Direction): d is Direction.left | Direction.right {
  return d === Direction.left || d === Direction.right
}

export interface Node<T = string> {
  type: T
  x: number
  y: number
}

export interface Vector<T> extends Node<T> {
  d: Direction
}

export function peek<T = string>(map: T[][], x: number, y: number, d: Direction): Vector<T> | undefined {
  let nx = x
  let ny = y
  switch (d) {
    case Direction.up: {
      if (y <= 0) return
      ny = y - 1
      break
    }

    case Direction.down: {
      if (y >= map.length - 1) return
      ny = y + 1
      break
    }

    case Direction.left: {
      if (x <= 0) return
      nx = x - 1
      break
    }

    case Direction.right: {
      if (x >= map[0].length - 1) return
      nx = x + 1
      break
    }
  }

  return {d, type: map[ny][nx], x: nx, y: ny}
}

export function move<T = string>(map: T[][], vector: Vector<T>, empty: T): Vector<T> | undefined {
  let nx = vector.x
  let ny = vector.y
  switch (vector.d) {
    case Direction.up: {
      if (vector.y <= 0) return
      ny = vector.y - 1
      break
    }

    case Direction.down: {
      if (vector.y >= map.length - 1) return
      ny = vector.y + 1
      break
    }

    case Direction.left: {
      if (vector.x <= 0) return
      nx = vector.x - 1
      break
    }

    case Direction.right: {
      if (vector.x >= map[0].length - 1) return
      nx = vector.x + 1
      break
    }
  }

  map[ny][nx] = vector.type
  map[vector.y][vector.x] = empty
  return {d: vector.d, type: vector.type, x: nx, y: ny}
}
