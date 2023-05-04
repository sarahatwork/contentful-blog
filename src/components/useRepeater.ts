import { z } from 'zod'

interface IProps<T> {
  items: ReadonlyArray<{
    entryProperties: ReadonlyArray<Queries.RepeaterFragment>
  } | null> | null
  schema: z.ZodType<T>
}

const useRepeater = <T>({ items, schema }: IProps<T>) => {
  if (!items) return null

  const object = items.flatMap((e) =>
    e
      ? [
          e.entryProperties.reduce((acc, property) => {
            if (!property) return acc

            switch (property.__typename) {
              case 'RepeaterPropertyText':
                acc[property.name] = property.text
                break
              case 'RepeaterPropertyRichText':
                acc[property.name] = {
                  raw: property.richTextRaw,
                  references: property.richTextReferences,
                }
                break
              case 'RepeaterPropertyMedia':
                acc[property.name] = property.media
                break
              case 'RepeaterPropertyBoolean':
                acc[property.name] = !!property.boolean
                break
            }
            return acc
          }, {}),
        ]
      : []
  )

  return schema.parse(object)
}
export default useRepeater
