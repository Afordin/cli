import {Command} from '@oclif/core'
import {main} from '@afordin/create'

export default class Create extends Command {
  static description = 'Create scaffolding projects'

  async run (): Promise<void> {
    // Remove 3° argument, the word "create"
    process.argv.splice(2, 1)

    main()
  }
}
